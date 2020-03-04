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

export default declare((api, options) => {
    api.assertVersion(7);
    const { prefix } = options;
    return {
        name: "jsx-rename",
        visitor: {
            JSXElement: (path) => {
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
                    const transferTagName = tagName.replace(/^\S/, s => s.toUpperCase());
                    namePath.replaceWith(
                        jsxIdentifier(`${prefix}${transferTagName}`)
                    )
                })
            },
        },
    };
});
