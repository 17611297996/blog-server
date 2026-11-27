// 从 Markdown 正文生成纯文本摘要（正文里可能混有编辑器保存的 HTML 片段）
const decode = s => s
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');

// 去掉 HTML 标签，包括被截断、没有闭合的半个标签
const stripHtml = (s = '') => decode(String(s).replace(/<[^>]*>/g, ' ').replace(/<[^>]*$/, ''))
    .replace(/\s+/g, ' ')
    .trim();

const makeExcerpt = (content = '', max = 150) => {
    const text = String(content)
        .replace(/```[\s\S]*?```/g, ' ') // 代码块
        .replace(/<(style|script)[\s\S]*?<\/\1>/gi, ' ')
        .replace(/<[^>]+>/g, ' ') // HTML 标签
        .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // 图片
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // 链接只留文字
        .replace(/`([^`]*)`/g, '$1') // 行内代码
        .replace(/^\s*\|?(\s*:?-{3,}:?\s*\|)+\s*:?-*:?\s*$/gm, ' ') // 表格分隔行
        .replace(/\|/g, ' ')
        .replace(/^\s{0,3}(#{1,6}|>|[-*+]\s+\[[ xX]\]|[-*+]|\d+\.)\s+/gm, '') // 标题、引用、列表标记
        .replace(/^\s*([-*_]\s*){3,}$/gm, ' ') // 分隔线
        .replace(/\*\*|~~|\*/g, '');
    const plain = decode(text).replace(/\s+/g, ' ').trim();
    return plain.length > max ? `${plain.slice(0, max)}...` : plain;
};

module.exports = { makeExcerpt, stripHtml };
