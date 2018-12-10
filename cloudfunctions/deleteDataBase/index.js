const cloud = require('wx-server-sdk')
cloud.init();
const db = cloud.database(),
  _ = db.command;

// 通过管理员接口
exports.main = async (event, context) => {
  let { basedata } = event;
  let ss = await db.collection(basedata).where({
    _id: _.neq("")
  }).remove();
  return ss;
}