const pad = (n, w = 4) => String(n).padStart(w, '0');

const dateStamp = () => {
  const d = new Date();
  const z = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}${z(d.getMonth() + 1)}${z(d.getDate())}`;
};

const nextSequence = async (connection, key) => {
  const result = await connection.collection('counters').findOneAndUpdate(
    { _id: key },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' }
  );

  return result.seq || result.value?.seq;
};

const numberInWords = (num) => {
  const a = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const b = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  const inWords = n => {
    if (n === 0) return '';
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + inWords(n % 10000000) : '');
  };
  const whole = Math.floor(num);
  const dec   = Math.round((num - whole) * 100);
  let result  = inWords(whole) + ' Rupees';
  if (dec > 0) result += ' and ' + inWords(dec) + ' Paise';
  return (result + ' Only').replace(/\s+/g, ' ').trim();
};

const paginateQuery = async (Model, filter, options = {}) => {
  const { page = 1, limit = 20, sort = { createdAt: -1 }, populate = [] } = options;
  const skip  = (page - 1) * limit;
  let q = Model.find(filter).sort(sort).skip(skip).limit(limit);
  populate.forEach(p => { q = q.populate(p); });
  const [data, total] = await Promise.all([q.lean(), Model.countDocuments(filter)]);
  return { data, total, page, limit, pages: Math.ceil(total / limit) };
};

const respOk  = (res, data, message = 'Success', code = 200) => res.status(code).json({ success: true, message, data });
const respErr = (res, message = 'Error', code = 400) => res.status(code).json({ success: false, message });

module.exports = { pad, dateStamp, nextSequence, numberInWords, paginateQuery, respOk, respErr };
