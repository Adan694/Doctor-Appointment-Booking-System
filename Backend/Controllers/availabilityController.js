const Availability = require('../models/availability');

exports.createAvailability = async (req, res) => {
    const doctorId = req.params.id; // Get doctorId from the route parameter
    const { availabilitySlots } = req.body;

    const availability = new Availability({
        doctorId,
        availabilitySlots
    });

    try {
        await availability.save();
        res.status(201).send(availability);
    } catch (error) {
        res.status(400).send(error);
    }
};

// Fetch availability
exports.getAvailability = async (req, res) => {
    const doctorId = req.params.id;

    try {
        const availability = await Availability.findOne({ doctorId });
        if (!availability) {
            return res.status(404).send({ message: 'Availability not found' });
        }
        res.send(availability);
    } catch (error) {
        res.status(500).send(error);
    }
};

// Add your updateAvailability function as needed