/**
 * Utility to safely serialize BigInt values to strings for JSON responses
 * Prevents "Do not know how to serialize a BigInt" errors
 */

export const serializeBigInt = (value) => {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
};

export const serializeObject = (obj) => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'bigint') {
    return obj.toString();
  }

  if (Array.isArray(obj)) {
    return obj.map(serializeObject);
  }

  if (typeof obj === 'object') {
    const serialized = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        serialized[key] = serializeObject(obj[key]);
      }
    }
    return serialized;
  }

  return obj;
};

export const safeJsonResponse = (res, statusCode, data) => {
  const serializedData = serializeObject(data);
  return res.status(statusCode).json(serializedData);
};