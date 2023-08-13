//  These mappings allow us to replace Figma vars and static values with the appropriate frontend definitions
//  Would be more powerful if this were generated dynamically... built manually for this proof of concept
import * as mappings from './mappings.json';

type CSS ={
  [key: string]: string;
} 

const toCamelCase = (str: string) => {
  return str.replace(/[-\s]+(.)?/g, function(match, char) {
    return char ? char.toUpperCase() : '';
  }).replace(/^(.)/, function(match, char) {
    return char.toLowerCase();
  });
}

const extractNumberWithPx = (str: string): string => {
  const regex = /^(\d+.?\d+)px$/;
  const match = str.match(regex);
  return match ? match[1] : str;
}

const swapVars = (str: string): string => {
  const regexForAllVars = /(var\(([A-Za-z0-9-]+)[^)]*\))/g;
  const replaced = str.replace(regexForAllVars, match => {
    const regexForVar = /var\(([A-Za-z0-9-]+)/;
    const matches = str.match(regexForVar);
    let mapped = "";
    if (matches && matches[1]){
      let key = matches[1] as keyof typeof mappings;
      mapped = mappings[key];
    }
    return mapped ? "${"+mapped+"}" : str;
  });
  return replaced;
}

const swapSpacingConstants = (str: string): string => {
  const regexAll = /(?:^| )([-0-9]+px)/g;
  const replaced = str.replace(regexAll, match => {
    let key = match.trim() as keyof typeof mappings;
    let mapped = mappings[key];
    return mapped ? " ${" + mapped + "}" : match;
  });
  return replaced.trim();
}

const addQuotesIfNeeded = (value: string): string => {
  //  If there is just one variable in here, don't add quotes, and remove ${} syntax
  const singleVarRegex = /^\${([a-zA-z0-9.-]+)}$/;
  const singleVarMatch = value.match(singleVarRegex);
  if (singleVarMatch && singleVarMatch.length){
    return singleVarMatch[1];
  }

  //  If there's still a variable found, wrap in ``
  const multiVarRegex = /(\${.+})/;
  const multiVarmatches = value.match(multiVarRegex);
  if (multiVarmatches && multiVarmatches.length > 1){
    return "`" + value + "`"
  }

  //  Otherwise add double quotes around the whole thing if it's not a number
  return isNaN(parseFloat(value)) || !isFinite(value as any) ? `"${value}"` : value;
};

const cssObjectToCssString = (nodeName:string, cssObject:CSS): string => {
  let result = `${toCamelCase(nodeName)}: {\n`;

  for (const property of Object.keys(cssObject)) {
    const value = cssObject[property];
    const camelCaseProperty = toCamelCase(property);
    const checkedForEmbeddedVars = swapVars(value);
    const checkedForSpacingConstants = swapSpacingConstants(checkedForEmbeddedVars);
    const checkedForNumPX = extractNumberWithPx(checkedForSpacingConstants);
    const quotedValue = addQuotesIfNeeded(checkedForSpacingConstants);
    result += `\t${camelCaseProperty}: ${quotedValue},\n`;
  }

  return result + '},';
};

const genCssStr = async (node : SceneNode ) : Promise<string> => {
  const css = await node.getCSSAsync();
  return cssObjectToCssString(node.name, css);
}

//
//  The listener that kicks it all off...
//
figma.codegen.on('generate', async (e : CodegenEvent) => {
  const node = e.node;
  const parentCss = await genCssStr(node);
  return  [{
    title: 'Aphrodite',
    code: parentCss,
    language: 'JAVASCRIPT'
  }];
});