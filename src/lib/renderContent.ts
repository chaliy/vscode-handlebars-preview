import Handlebars from "handlebars";

export default (
  templateSource,
  dataSource,
  helperFunctionInfos: HelperFunctionInfo[]
): string => {
  if (!templateSource) {
    return "<body>Select document to render</body>";
  }

  try {
    let data = JSON.parse(dataSource || "{}");
    for (const { name, body } of helperFunctionInfos) {
      Handlebars.registerHelper(name, body);
    }
    let template = Handlebars.compile(templateSource);
    return template(data);
  } catch (ex) {
    return `
            <body>
                <h2>Error occured</h2>
                <pre>${ex}</pre>
            </body>
        `;
  }
}
export interface HelperFunctionInfo {
  name: string;
  body: Function;
}