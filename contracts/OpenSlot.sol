// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title OpenSlot
 * @notice Decentralized appointment-booking platform on BOT Chain.
 * @dev Highly gas-optimized storage packing: each slot occupies exactly 2 storage slots.
 */
contract OpenSlot {
    enum SlotStatus {
        Available, // 0: Slot open for booking
        Booked,    // 1: Booked by a customer, awaiting business confirmation
        Confirmed, // 2: Confirmed by business
        Cancelled  // 3: Cancelled by business or customer
    }

    struct Slot {
        // --- Storage Slot 0 (21 bytes) ---
        address business;     // 20 bytes: Business address
        SlotStatus status;    // 1 byte: Current status
        // --- Storage Slot 1 (30 bytes) ---
        address customer;     // 20 bytes: Customer address (address(0) if unbooked)
        uint48 startTime;     // 6 bytes: Unix timestamp in seconds (valid past yr 8,900,000)
        uint32 duration;      // 4 bytes: Duration in seconds (e.g., 1800 for 30 min)
    }

    struct Business {
        bool isRegistered;
        string metadataURI;   // Off-chain IPFS / JSON string (name, category, description, logo)
    }

    // Incremental slot ID starting at 1
    uint256 public nextSlotId = 1;

    // Slot storage
    mapping(uint256 => Slot) public slots;

    // Business registry
    mapping(address => Business) public businesses;
    address[] public registeredBusinesses;

    // Fast index lookups
    mapping(address => uint256[]) private _businessSlotIds;
    mapping(address => uint256[]) private _customerSlotIds;

    // Events
    event BusinessRegistered(address indexed business, string metadataURI);
    event BusinessUpdated(address indexed business, string metadataURI);
    event SlotCreated(uint256 indexed slotId, address indexed business, uint48 startTime, uint32 duration);
    event SlotBooked(uint256 indexed slotId, address indexed business, address indexed customer);
    event BookingCancelled(uint256 indexed slotId, address indexed business, address indexed customer);
    event SlotCancelled(uint256 indexed slotId, address indexed business);
    event BookingConfirmed(uint256 indexed slotId, address indexed business, address indexed customer);

    // Modifiers
    modifier onlyRegisteredBusiness() {
        require(businesses[msg.sender].isRegistered, "OpenSlot: Not a registered business");
        _;
    }

    modifier slotExists(uint256 slotId) {
        require(slotId > 0 && slotId < nextSlotId, "OpenSlot: Slot does not exist");
        _;
    }

    /**
     * @notice Register or update the calling wallet as a business.
     * @param metadataURI Off-chain JSON URI/string containing business profile, name, avatar, bio.
     */
    function registerBusiness(string calldata metadataURI) external {
        if (!businesses[msg.sender].isRegistered) {
            businesses[msg.sender] = Business({
                isRegistered: true,
                metadataURI: metadataURI
            });
            registeredBusinesses.push(msg.sender);
            emit BusinessRegistered(msg.sender, metadataURI);
        } else {
            businesses[msg.sender].metadataURI = metadataURI;
            emit BusinessUpdated(msg.sender, metadataURI);
        }
    }

    /**
     * @notice Create a single appointment slot.
     * @param startTime Unix timestamp (seconds) when appointment begins. Must be in future.
     * @param duration Appointment duration in seconds (e.g. 1800 = 30m, 3600 = 1h).
     */
    function createSlot(uint48 startTime, uint32 duration) external onlyRegisteredBusiness returns (uint256) {
        require(startTime > block.timestamp, "OpenSlot: Start time must be in future");
        require(duration >= 300 && duration <= 86400, "OpenSlot: Duration must be between 5m and 24h");

        uint256 slotId = nextSlotId++;

        slots[slotId] = Slot({
            business: msg.sender,
            status: SlotStatus.Available,
            customer: address(0),
            startTime: startTime,
            duration: duration
        });

        _businessSlotIds[msg.sender].push(slotId);

        emit SlotCreated(slotId, msg.sender, startTime, duration);
        return slotId;
    }

    /**
     * @notice Batch create multiple appointment slots at once to save gas.
     * @param startTimes Array of future Unix timestamps (seconds).
     * @param duration Duration for each slot in seconds.
     */
    function createBatchSlots(uint48[] calldata startTimes, uint32 duration) external onlyRegisteredBusiness {
        require(startTimes.length > 0 && startTimes.length <= 50, "OpenSlot: Invalid batch size (1-50)");
        require(duration >= 300 && duration <= 86400, "OpenSlot: Duration must be between 5m and 24h");

        for (uint256 i = 0; i < startTimes.length; i++) {
            uint48 startTime = startTimes[i];
            require(startTime > block.timestamp, "OpenSlot: Start time must be in future");

            uint256 slotId = nextSlotId++;

            slots[slotId] = Slot({
                business: msg.sender,
                status: SlotStatus.Available,
                customer: address(0),
                startTime: startTime,
                duration: duration
            });

            _businessSlotIds[msg.sender].push(slotId);
            emit SlotCreated(slotId, msg.sender, startTime, duration);
        }
    }

    /**
     * @notice Customer books an available slot.
     * @param slotId The ID of the slot to book.
     */
    function bookSlot(uint256 slotId) external slotExists(slotId) {
        Slot storage slot = slots[slotId];

        require(slot.status == SlotStatus.Available, "OpenSlot: Slot is not available");
        require(slot.startTime > block.timestamp, "OpenSlot: Slot has already expired");
        require(msg.sender != slot.business, "OpenSlot: Business cannot book own slot");

        slot.status = SlotStatus.Booked;
        slot.customer = msg.sender;

        _customerSlotIds[msg.sender].push(slotId);

        emit SlotBooked(slotId, slot.business, msg.sender);
    }

    /**
     * @notice Customer cancels their booked appointment.
     * @param slotId The ID of the slot to cancel.
     */
    function cancelBooking(uint256 slotId) external slotExists(slotId) {
        Slot storage slot = slots[slotId];

        require(slot.customer == msg.sender, "OpenSlot: Only customer can cancel booking");
        require(
            slot.status == SlotStatus.Booked || slot.status == SlotStatus.Confirmed,
            "OpenSlot: Booking cannot be cancelled in current status"
        );
        require(slot.startTime > block.timestamp, "OpenSlot: Cannot cancel past appointment");

        slot.status = SlotStatus.Cancelled;

        emit BookingCancelled(slotId, slot.business, msg.sender);
    }

    /**
     * @notice Business confirms a booked appointment.
     * @param slotId The ID of the slot to confirm.
     */
    function confirmBooking(uint256 slotId) external slotExists(slotId) {
        Slot storage slot = slots[slotId];

        require(slot.business == msg.sender, "OpenSlot: Only business can confirm booking");
        require(slot.status == SlotStatus.Booked, "OpenSlot: Slot is not in Booked status");

        slot.status = SlotStatus.Confirmed;

        emit BookingConfirmed(slotId, msg.sender, slot.customer);
    }

    /**
     * @notice Business cancels an unbooked slot.
     * @param slotId The ID of the unbooked slot to cancel.
     */
    function cancelSlot(uint256 slotId) external slotExists(slotId) {
        Slot storage slot = slots[slotId];

        require(slot.business == msg.sender, "OpenSlot: Only business owner can cancel slot");
        require(slot.status == SlotStatus.Available, "OpenSlot: Can only cancel unbooked slots");

        slot.status = SlotStatus.Cancelled;

        emit SlotCancelled(slotId, msg.sender);
    }

    // ==========================================
    // VIEW / GETTER FUNCTIONS FOR FRONTEND
    // ==========================================

    /**
     * @notice Returns single slot data.
     */
    function getSlot(uint256 slotId) external view slotExists(slotId) returns (
        address business,
        SlotStatus status,
        address customer,
        uint48 startTime,
        uint32 duration
    ) {
        Slot storage s = slots[slotId];
        return (s.business, s.status, s.customer, s.startTime, s.duration);
    }

    /**
     * @notice Returns batch of slots for high-performance frontend queries.
     */
    function getSlotsBatch(uint256[] calldata slotIds) external view returns (Slot[] memory) {
        Slot[] memory batch = new Slot[](slotIds.length);
        for (uint256 i = 0; i < slotIds.length; i++) {
            uint256 id = slotIds[i];
            if (id > 0 && id < nextSlotId) {
                batch[i] = slots[id];
            }
        }
        return batch;
    }

    /**
     * @notice Returns total number of registered businesses.
     */
    function getRegisteredBusinessesCount() external view returns (uint256) {
        return registeredBusinesses.length;
    }

    /**
     * @notice Returns all registered business addresses.
     */
    function getAllRegisteredBusinesses() external view returns (address[] memory) {
        return registeredBusinesses;
    }

    /**
     * @notice Returns all slot IDs created by a given business.
     */
    function getBusinessSlotIds(address business) external view returns (uint256[] memory) {
        return _businessSlotIds[business];
    }

    /**
     * @notice Returns all slot IDs booked by a given customer.
     */
    function getCustomerSlotIds(address customer) external view returns (uint256[] memory) {
        return _customerSlotIds[customer];
    }
}

