/**
 * 判断是否为外部链接
 * @param {string} path
 * @returns {boolean}
 */
export function isExternal(path: string): boolean {
  return /^(https?:|mailto:|tel:)/.test(path);
}

/**
 * 判断是否为有效的URL
 * @param {string} url
 * @returns {boolean}
 */
export function validURL(url: string): boolean {
  const reg = /^(https?|ftp):\/\/([a-zA-Z0-9.-]+(:[a-zA-Z0-9.&%$-]+)*@)*((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3}|([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\.(com|edu|gov|int|mil|net|org|biz|arpa|info|name|pro|aero|coop|museum|[a-zA-Z]{2}))(:[0-9]+)*(\/($|[a-zA-Z0-9.,?'\\+&%$#=~_-]+))*$/;
  return reg.test(url);
}

/**
 * 判断是否为有效的邮箱
 * @param {string} email
 * @returns {boolean}
 */
export function validEmail(email: string): boolean {
  const reg = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return reg.test(email);
}

/**
 * 判断是否为有效的手机号
 * @param {string} phone
 * @returns {boolean}
 */
export function validPhone(phone: string): boolean {
  const reg = /^1[3-9]\d{9}$/;
  return reg.test(phone);
}

/**
 * 判断是否为有效的身份证号
 * @param {string} idCard
 * @returns {boolean}
 */
export function validIDCard(idCard: string): boolean {
  const reg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
  return reg.test(idCard);
}

/**
 * 判断是否为有效的密码（至少包含大小写字母和数字，长度8-20）
 * @param {string} password
 * @returns {boolean}
 */
export function validPassword(password: string): boolean {
  const reg = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,20}$/;
  return reg.test(password);
}

/**
 * 判断是否为空值
 * @param {any} value
 * @returns {boolean}
 */
export function isEmpty(value: any): boolean {
  return (
    value === undefined || 
    value === null || 
    (typeof value === 'string' && value.trim() === '') ||
    (Array.isArray(value) && value.length === 0) ||
    (typeof value === 'object' && Object.keys(value).length === 0)
  );
}