const jwt = require('jsonwebtoken');
// Lazy require to avoid circular deps
const getEmployeeUser = () => require('../models/EmployeeUser');

exports.protectEmployee = async (req, res, next) => {
  try {
    // 1. Extract token from Authorization header (Bearer) OR employeeToken cookie
    let token;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.employeeToken) {
      token = req.cookies.employeeToken;
    }
    if (!token) return res.status(401).json({ message: 'No token provided' });

    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'employee') {
      return res.status(401).json({ message: 'Invalid token type' });
    }

    // 3. Fetch user
    const EmployeeUser = getEmployeeUser();
    const user = await EmployeeUser.findById(decoded.id).populate('employee').lean();
    if (!user || user.isDeleted) return res.status(401).json({ message: 'Not authorized' });
    if (!user.isActive) return res.status(401).json({ message: 'Account inactive' });

    // 4. Attach to req
    req.employeeUser = user;
    req.employee = user.employee;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized', error: err.message });
  }
};
