import { ref } from 'vue';

export const checkDuplicateName = (items, newName) => {
  return items.some(item => 
    item.name.trim().toLowerCase() === newName.trim().toLowerCase()
  );
};

export const validateFileName = (name) => {
  const invalidChars = ['/', '\\', ':', '*', '?', '"', '<', '>', '|'];
  return !invalidChars.some(char => name.includes(char));
};

export default checkService = {
  checkDuplicateName,
  validateFileName
}