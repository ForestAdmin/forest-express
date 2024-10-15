function lowerCaseFirstLetter(string) {
  return string.charAt(0).toLowerCase() + string.slice(1);
}

const subElementsKey = { Row: 'fields', Page: 'elements' };
const validLayoutComponents = ['Row', 'Page', 'Separator', 'HtmlBlock'];
class SmartActionFormLayoutService {
  static validateLayoutElement(element) {
    if (!validLayoutComponents.includes(element.component)) throw new Error(`${element.component} is not a valid component. Valid components are ${validLayoutComponents.join(' or ')}`);
    if (element.component === 'Page') {
      if (!Array.isArray(element.elements)) {
        throw new Error('Page components must contain an array of fields or layout elements in property \'elements\'');
      }
      if (element.elements.some((innerElement) => innerElement.component === 'Page')) {
        throw new Error('Pages cannot contain other pages');
      }
    }
    if (element.component === 'Row') {
      if (!Array.isArray(element.fields)) {
        throw new Error('Row components must contain an array of fields in property \'fields\'');
      }
      if (element.fields.some((field) => field.type === 'Layout')) {
        throw new Error('Row components can only contain fields');
      }
    }
  }

  static parseLayout(
    element,
    allFields,
  ) {
    if (element.type === 'Layout') {
      SmartActionFormLayoutService.validateLayoutElement(element);

      if (['Row', 'Page'].includes(element.component)) {
        const key = subElementsKey[element.component];
        const subElements = element[key].map(
          (field) => SmartActionFormLayoutService.parseLayout(field, allFields),
        );

        return {
          ...element,
          component: lowerCaseFirstLetter(element.component),
          [key]: subElements,
        };
      }
      return {
        ...element,
        component: lowerCaseFirstLetter(element.component),
      };
    }

    allFields.push(element);

    return {
      type: 'Layout',
      component: 'input',
      fieldId: element.field,
    };
  }

  // eslint-disable-next-line class-methods-use-this
  extractFieldsAndLayout(formElements) {
    let hasLayout = false;
    const fields = [];
    let layout = [];

    if (!formElements) return { fields: [], layout: [] };

    const isFirstElementPage = formElements[0].component === 'Page';

    formElements.forEach((element) => {
      if (element.type === 'Layout') {
        hasLayout = true;
      }
      if (isFirstElementPage && element.component !== 'Page') {
        throw new Error('You cannot use pages and other elements at the same level');
      }
      layout.push(SmartActionFormLayoutService.parseLayout(element, fields));
    });

    if (!hasLayout) {
      layout = [];
    }

    return { fields, layout };
  }
}

module.exports = SmartActionFormLayoutService;
