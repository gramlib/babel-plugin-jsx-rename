import { declare } from "@babel/helper-plugin-utils";
import { jsxIdentifier } from '@babel/types';

function getTagNameByJSXElement(path) {
    const node = path.node || path;
    const openingElement = node.openingElement;
    const tagNameIdentifier = openingElement.name;
    return tagNameIdentifier.name
}

function isCustomJsxTag(path) {
    const tagName = getTagNameByJSXElement(path);

    return !tagName || (tagName[0] === tagName[0].toUpperCase());
}


function toHump(name) {
    return name.replace(/\-(\w)/g, function (all, letter) {
        return letter.toUpperCase();
    });
}

export default declare((api, options) => {
    api.assertVersion(7);
    const { prefix, importee } = options;
    return {
        name: "jsx-rename",
        pre(state) {
            this.renameComponentCache = new Set();
        },
        post(state) {
            this.renameComponentCache = null;
        },
        visitor: {
            Program: {
                exit(path) {
                    const imports = [...this.renameComponentCache];
                    if (imports && imports.length > 0) {
                        const marsImport = api.template(`import {${imports.join(',')}} from "${importee}";`, { sourceType: "module" });
                        // console.log(`import {${imports.join(',')}} from "${importee}";`, marsImport)
                        path.node.body.unshift(marsImport());
                    }

                }
            },
            JSXElement(path) {
                if (isCustomJsxTag(path)) {
                    // 若元素为自定义组件
                    // 不予处理
                    return;
                }
                const openingElement = path.get('openingElement');
                const closingElement = path.get('closingElement');

                [openingElement, closingElement].forEach(el => {
                    if (!el.node) return;
                    const namePath = el.get('name');
                    const tagName = namePath.node.name;
                    let transferTagName = toHump(tagName);
                    transferTagName = transferTagName.replace(/^\S/, s => s.toUpperCase());
                    namePath.replaceWith(
                        jsxIdentifier(`${prefix}${transferTagName}`)
                    )

                    this.renameComponentCache.add(`${prefix}${transferTagName}`);
                })
            },
        },
    };
});
