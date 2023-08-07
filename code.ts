type CSS ={
  [key: string]: string;
} 

// TODO: Pull these out into a separate file that can be generated
const varMappings = {
  "--blue" : "Color.blue",
  "--core-blue" : "Color.blue",
  "--core-purple" : "Color.purple",
  "--core-green" : "Color.green",
  "--core-gold" : "Color.gold",
  "--core-red" : "Color.red",
  "--neutral-off-black" : "Color.offBlack",
  "--neutral-off-black-64" : "Color.offBlack64",
  "--neutral-off-black-50" : "Color.offBlack50",
  "--neutral-off-black-32" : "Color.offBlack32",
  "--neutral-off-black-16" : "Color.offBlack16",
  "--neutral-off-black-8" : "Color.offBlack8",
  "--neutral-off-white" : "Color.offWhite",
  "--neutral-white" : "Color.white",
  "--neutral-white-64" : "Color.white64",
  "--neutral-white-50" : "Color.white50",
  "--brand-dark-blue" : "Color.darkBlue",
  "--brand-teal" : "Color.teal",
  "--brand-light-blue" : "Color.lightBlue",
  "--brand-pink" : "Color.pink",
  "--ai" : "GuideColors.darkRed",
  "--ai-dark-red" : "GuideColors.darkRed",
  "--ai-off-white-30" : "GuideColors.offWhite30",
  "--ai-off-white-15" : "GuideColors.offWhite15",
  "--ai-peach" : "GuideColors.peach",
  "2px" : "Spacing.xxxxSmall_2",
  "4px" : "Spacing.xxxSmall_4",
  "8px" : "Spacing.xSmall_8",
  "12px" : "Spacing.small_12",
  "16px" : "Spacing.medium_16",
  "24px" : "Spacing.large_24",
  "32px" : "Spacing.xLarge_32",
  "48px" : "Spacing.xxLarge_48",
  "64px" : "Spacing.xxxLarge_64",
}

// const kebabToCamelCase = (str: string): string => str.replace(/-([a-z])/g, (_match, char) => char.toUpperCase());

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
      let key = matches[1] as keyof typeof varMappings;
      mapped = varMappings[key];
    }
    return mapped ? "${"+mapped+"}" : str;
  });
  return replaced;
}

const swapSpacingConstants = (str: string): string => {
  const regexAll = /(?:^| )([-0-9]+px)/g;
  const replaced = str.replace(regexAll, match => {
    let key = match.trim() as keyof typeof varMappings;
    console.log(" SSS key="+key)
    let mapped = varMappings[key];
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

figma.codegen.on('generate', async (e : CodegenEvent) => {
  const node = e.node;

  const parentCss = await genCssStr(node);

  return  [{
    title: 'Aphrodite',
    code: parentCss,
    language: 'JAVASCRIPT'
  }];
});