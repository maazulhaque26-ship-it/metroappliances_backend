const mongoose = require('mongoose');
const { ok, created, notFound, serverError } = require('../utils/response');

const AIKnowledge = () => mongoose.model('AIKnowledge');

exports.listKnowledge = async (req, res) => {
  try {
    const { category, module, isVerified, limit = 50, page = 1 } = req.query;
    const filter = { isActive: true };
    if (category)   filter.category   = category;
    if (module)     filter.module     = module;
    if (isVerified !== undefined) filter.isVerified = isVerified === 'true';
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      AIKnowledge().find(filter).sort({ useCount: -1, isVerified: -1 }).skip(skip).limit(Number(limit)).lean(),
      AIKnowledge().countDocuments(filter),
    ]);
    ok(res, { data, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (e) { serverError(res, e); }
};

exports.getKnowledge = async (req, res) => {
  try {
    const k = await AIKnowledge().findById(req.params.id).lean();
    if (!k) return notFound(res, 'Knowledge entry not found');
    ok(res, k);
  } catch (e) { serverError(res, e); }
};

exports.createKnowledge = async (req, res) => {
  try {
    const k = await AIKnowledge().create({ ...req.body, createdBy: req.user?._id });
    created(res, k);
  } catch (e) { serverError(res, e); }
};

exports.updateKnowledge = async (req, res) => {
  try {
    const k = await AIKnowledge().findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!k) return notFound(res, 'Knowledge entry not found');
    ok(res, k);
  } catch (e) { serverError(res, e); }
};

exports.deleteKnowledge = async (req, res) => {
  try {
    const k = await AIKnowledge().findById(req.params.id);
    if (!k) return notFound(res, 'Knowledge entry not found');
    await AIKnowledge().findByIdAndUpdate(req.params.id, { isActive: false });
    ok(res, { deleted: true });
  } catch (e) { serverError(res, e); }
};

exports.searchKnowledge = async (req, res) => {
  try {
    const { q, category, limit = 20 } = req.query;
    if (!q) return ok(res, []);
    const regex = new RegExp(q.split(/\s+/).join('|'), 'i');
    const filter = {
      isActive: true,
      $or: [{ question: regex }, { answer: regex }, { keywords: regex }, { tags: regex }],
    };
    if (category) filter.category = category;
    const data = await AIKnowledge().find(filter).sort({ useCount: -1, isVerified: -1 }).limit(Number(limit)).lean();
    ok(res, data);
  } catch (e) { serverError(res, e); }
};

exports.getByModule = async (req, res) => {
  try {
    const { module } = req.params;
    const data = await AIKnowledge().find({ module, isActive: true }).sort({ useCount: -1 }).limit(20).lean();
    ok(res, data);
  } catch (e) { serverError(res, e); }
};

exports.incrementUseCount = async (req, res) => {
  try {
    const k = await AIKnowledge().findByIdAndUpdate(req.params.id, { $inc: { useCount: 1 } }, { new: true });
    if (!k) return notFound(res, 'Knowledge entry not found');
    ok(res, { useCount: k.useCount });
  } catch (e) { serverError(res, e); }
};

exports.seedBuiltInKnowledge = async (req, res) => {
  try {
    const entries = [
      { category: 'faq',         question: 'How do I create a purchase order?',          answer: 'Go to Procurement > Purchase Orders > New PO. Select vendor, add line items, and submit for approval.', keywords: ['purchase order','PO','procurement'], module: 'procurement', isBuiltIn: true, isVerified: true },
      { category: 'faq',         question: 'How do I process payroll?',                  answer: 'Go to Payroll > Process Payroll > Select period. Review salary components and run calculation. Approve and disburse.', keywords: ['payroll','salary','hr'], module: 'payroll', isBuiltIn: true, isVerified: true },
      { category: 'metric',      question: 'What is CPI in project management?',         answer: 'Cost Performance Index (CPI) = Earned Value (EV) / Actual Cost (AC). CPI > 1 means under budget.', keywords: ['CPI','earned value','project'], module: 'projects', isBuiltIn: true, isVerified: true },
      { category: 'metric',      question: 'What is SPI?',                               answer: 'Schedule Performance Index (SPI) = Earned Value (EV) / Planned Value (PV). SPI < 1 means behind schedule.', keywords: ['SPI','schedule','project'], module: 'projects', isBuiltIn: true, isVerified: true },
      { category: 'process',     question: 'How does 3-way matching work in AP?',        answer: 'Three-way matching compares the Purchase Order, Goods Receipt Note (GRN), and Vendor Invoice. All three must match before payment is released.', keywords: ['3-way match','AP','accounts payable','invoice'], module: 'finance', isBuiltIn: true, isVerified: true },
      { category: 'formula',     question: 'How is inventory turnover calculated?',      answer: 'Inventory Turnover = Cost of Goods Sold / Average Inventory. A higher ratio indicates efficient inventory management.', keywords: ['inventory turnover','ratio','stock'], module: 'inventory', isBuiltIn: true, isVerified: true },
      { category: 'troubleshoot', question: 'Why is a machine showing breakdown status?', answer: 'A machine enters breakdown status when a downtime event is logged without resolution. Go to EAM > Downtime Events and create a maintenance work order to resolve it.', keywords: ['machine','breakdown','EAM','downtime'], module: 'manufacturing', isBuiltIn: true, isVerified: true },
      { category: 'policy',      question: 'What is the leave approval policy?',         answer: 'Leave requests must be approved by the direct manager within 2 business days. Requests more than 3 days require HR director approval. Retroactive leave is not permitted.', keywords: ['leave','policy','approval','HR'], module: 'hr', isBuiltIn: true, isVerified: true },
      { category: 'how_to',      question: 'How do I generate GST reports?',             answer: 'Go to Tax & Compliance > GST Returns. Select the filing period and click Generate. Review GSTR-1, GSTR-2A reconciliation, and then file GSTR-3B.', keywords: ['GST','tax','compliance','returns'], module: 'finance', isBuiltIn: true, isVerified: true },
      { category: 'faq',         question: 'How do I raise a service request?',          answer: 'Customers can raise a service request via the Customer Portal > My Requests > New Request, or call the service center. A technician will be assigned within 24 hours.', keywords: ['service','request','technician','after-sales'], module: 'service', isBuiltIn: true, isVerified: true },
    ];
    const seeded = [];
    for (const e of entries) {
      const exists = await AIKnowledge().findOne({ question: e.question });
      if (!exists) seeded.push(await AIKnowledge().create(e));
    }
    ok(res, { seeded: seeded.length });
  } catch (e) { serverError(res, e); }
};
