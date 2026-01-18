/**
 * Convert XML to JSON
 */
export function convertXMLToJSON(xmlString: string): string {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    
    // Check for parsing errors
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      throw new Error('Invalid XML: ' + parserError.textContent);
    }
    
    const result = xmlToJson(xmlDoc.documentElement);
    return JSON.stringify(result, null, 2);
  } catch (error) {
    throw new Error(`Failed to convert XML to JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Recursively convert XML element to JSON object
 */
function xmlToJson(element: Element): any {
  const result: any = {};
  
  // Handle attributes
  if (element.attributes.length > 0) {
    result['@attributes'] = {};
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      result['@attributes'][attr.name] = attr.value;
    }
  }
  
  // Handle child nodes
  const childNodes = Array.from(element.childNodes);
  const textNodes = childNodes.filter(node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim());
  const elementNodes = childNodes.filter(node => node.nodeType === Node.ELEMENT_NODE);
  
  // If there are text nodes and no element nodes, this is a text element
  if (textNodes.length > 0 && elementNodes.length === 0) {
    const text = textNodes.map(node => node.textContent?.trim()).join(' ').trim();
    if (element.attributes.length > 0) {
      result['#text'] = text;
      return result;
    }
    return text;
  }
  
  // Process element nodes
  const children: Record<string, any> = {};
  
  elementNodes.forEach((node) => {
    const childElement = node as Element;
    const tagName = childElement.tagName;
    
    if (children[tagName]) {
      // Multiple elements with same name - convert to array
      if (!Array.isArray(children[tagName])) {
        children[tagName] = [children[tagName]];
      }
      children[tagName].push(xmlToJson(childElement));
    } else {
      children[tagName] = xmlToJson(childElement);
    }
  });
  
  // Merge children into result
  Object.assign(result, children);
  
  // If only attributes and no children, return just attributes
  if (Object.keys(children).length === 0 && result['@attributes']) {
    return result;
  }
  
  return result;
}

/**
 * Convert JSON to XML
 */
export function convertJSONToXML(jsonString: string, rootElement: string = 'root'): string {
  try {
    const json = JSON.parse(jsonString);
    const xml = jsonToXml(json, rootElement);
    return formatXML(xml);
  } catch (error) {
    throw new Error(`Failed to convert JSON to XML: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Recursively convert JSON object to XML string
 */
function jsonToXml(obj: any, tagName: string): string {
  if (obj === null || obj === undefined) {
    return `<${tagName}></${tagName}>`;
  }
  
  // Handle primitives
  if (typeof obj !== 'object') {
    return `<${tagName}>${escapeXml(String(obj))}</${tagName}>`;
  }
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => jsonToXml(item, tagName)).join('');
  }
  
  // Handle objects
  let xml = `<${tagName}`;
  const attributes: string[] = [];
  const children: Array<{ name: string; value: any }> = [];
  
  // Separate attributes and children
  for (const [key, value] of Object.entries(obj)) {
    if (key === '@attributes' && typeof value === 'object' && value !== null) {
      // Add attributes
      for (const [attrName, attrValue] of Object.entries(value)) {
        attributes.push(`${attrName}="${escapeXml(String(attrValue))}"`);
      }
    } else if (key === '#text') {
      // Text content
      children.push({ name: '#text', value });
    } else if (Array.isArray(value)) {
      // Array of elements
      value.forEach(item => {
        children.push({ name: key, value: item });
      });
    } else {
      children.push({ name: key, value });
    }
  }
  
  // Add attributes to opening tag
  if (attributes.length > 0) {
    xml += ' ' + attributes.join(' ');
  }
  xml += '>';
  
  // Add text content if present
  const textContent = obj['#text'];
  if (textContent !== undefined) {
    xml += escapeXml(String(textContent));
  }
  
  // Add children
  children.forEach(({ name, value }) => {
    if (name !== '#text') {
      xml += jsonToXml(value, name);
    }
  });
  
  xml += `</${tagName}>`;
  return xml;
}

/**
 * Escape XML special characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Format/beautify XML string
 */
export function formatXML(xmlString: string, indent: number = 2): string {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    
    // Check for parsing errors
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      throw new Error('Invalid XML: ' + parserError.textContent);
    }
    
    return formatXMLNode(xmlDoc.documentElement, 0, indent);
  } catch (error) {
    throw new Error(`Failed to format XML: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Recursively format XML node with indentation
 */
function formatXMLNode(node: Element, level: number, indent: number): string {
  const indentStr = ' '.repeat(level * indent);
  
  let xml = indentStr + '<' + node.tagName;
  
  // Add attributes
  if (node.attributes.length > 0) {
    for (let i = 0; i < node.attributes.length; i++) {
      const attr = node.attributes[i];
      xml += ` ${attr.name}="${escapeXml(attr.value)}"`;
    }
  }
  
  const childNodes = Array.from(node.childNodes);
  const elementNodes = childNodes.filter(n => n.nodeType === Node.ELEMENT_NODE);
  const textNodes = childNodes.filter(n => n.nodeType === Node.TEXT_NODE && n.textContent?.trim());
  
  if (elementNodes.length === 0 && textNodes.length === 0) {
    // Self-closing tag
    xml += ' />\n';
  } else if (elementNodes.length === 0 && textNodes.length > 0) {
    // Text content only
    const text = textNodes.map(n => n.textContent?.trim()).join(' ').trim();
    xml += `>${escapeXml(text)}</${node.tagName}>\n`;
  } else {
    // Has child elements
    xml += '>\n';
    elementNodes.forEach(child => {
      xml += formatXMLNode(child as Element, level + 1, indent);
    });
    xml += indentStr + `</${node.tagName}>\n`;
  }
  
  return xml;
}

/**
 * Validate XML string
 */
export function validateXML(xmlString: string): { valid: boolean; error?: string } {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      return {
        valid: false,
        error: parserError.textContent || 'Invalid XML structure'
      };
    }
    
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
