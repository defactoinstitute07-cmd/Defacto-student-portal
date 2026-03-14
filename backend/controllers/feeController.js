const Fee = require('../models/Fee');

// GET /api/student/fees
exports.getStudentFees = async (req, res) => {
    try {
        const studentId = req.user.id; // from auth middleware

        const fees = await Fee.find({ studentId })
            .populate('studentId', 'name rollNo className fatherName motherName address session dob gender contact email')
            .select('-__v')
            .sort({ year: -1, createdAt: -1 })
            .lean();

        res.json({ success: true, fees });
    } catch (error) {
        console.error('Error fetching student fees:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// GET /api/student/fees/:id/receipt
exports.getFeeReceipt = async (req, res) => {
    try {
        const feeId = req.params.id;
        const studentId = req.user.id;

        const fee = await Fee.findOne({ _id: feeId, studentId })
            .populate('studentId', 'name rollNo className fatherName motherName address session')
            .lean();

        if (!fee) {
            return res.status(404).json({ success: false, message: 'Fee record not found' });
        }

        res.json({ success: true, receipt: fee });
    } catch (error) {
        console.error('Error fetching fee receipt:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// POST /api/student/fees (Experimental/Testing)
exports.createFee = async (req, res) => {
    try {
        const fee = new Fee({
            ...req.body,
            studentId: req.user.id
        });
        await fee.save();
        res.json({ success: true, fee });
    } catch (error) {
        console.error('Error creating fee:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
