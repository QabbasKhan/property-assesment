import moment from 'moment-timezone';

const data1 = moment().toDate();
const data2 = moment().tz('Atlantic/Bermuda', true).toDate();

console.log(data1);
console.log(data2);
