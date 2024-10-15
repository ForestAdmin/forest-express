class SmartActionFormLayoutService {
  static lowerCaseFirstLetter(string) {
    return string.charAt(0).toLowerCase() + string.slice(1);
  }

  static validateLayoutElement(element) {
    const validLayoutComponents = ['Row', 'Page', 'Separator', 'HtmlBlock'];
    if (validLayoutComponents.includes(element.component)) throw new Error(`${element.component} is not a valid component. Use ${validLayoutComponents.join(' or ')}`);
    if (element.component === 'Page' && !Array.isArray(element.elements)) {
      throw new Error('Page components must contain an array of fields or layout elements in property \'elements\'');
    }
    if (element.component === 'Row' && (!Array.isArray(element.fields))) {
      throw new Error('Row components must contain an array of fields in property \'fields\'');
    }
  }

  static parseLayout(
    element,
    allFields,
  ) {
    if (element.type === 'Layout') {
      SmartActionFormLayoutService.validateLayoutElement(element);
      const subElementsKey = {
        Row: 'fields',
        Page: 'elements',
      };

      if (element.component === 'Row' || element.component === 'Page') {
        const key = subElementsKey[element.component];
        const subElements = element[key].map(
          (field) => SmartActionFormLayoutService.parseLayout(field, allFields),
        );

        return {
          ...element,
          component: SmartActionFormLayoutService.lowerCaseFirstLetter(element.component),
          [key]: subElements,
        };
      }
      return {
        ...element,
        component: SmartActionFormLayoutService.lowerCaseFirstLetter(element.component),
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

    formElements.forEach((element) => {
      if (element.type === 'Layout') {
        hasLayout = true;
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
