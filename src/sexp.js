import util from 'node:util';

/*export function sexpFind(sexp, pred) {
    if (!Array.isArray(sexp))
        return;


}*/

export function sexpCallName(sexp) {
    if (!Array.isArray(sexp))
        return;

    return symName(sexp[0]);
}

export function sym(name) {
    return { $sym: String(name) }
}

export function isSym(v) {
    return (
        v !== null &&
        typeof v === 'object' &&
        typeof v.$sym === 'string'
    )
}

export function symName(v) {
    return isSym(v) ? v.$sym : null
}

export function symEq(v, other) {
    if (!isSym(v)) return false

    if (isSym(other)) {
        return v.$sym === other.$sym
    }

    if (typeof other === 'string') {
        return v.$sym === other
    }

    return false
}

export function sexpParse(input) {
    let i = 0

    const skipWhitespace = () => {
        while (i < input.length && /\s/.test(input[i])) i++
    }

    const parseString = () => {
        let str = ''
        i++ // skip opening "
        while (i < input.length) {
            if (input[i] === '"') {
                i++
                break
            } else if (input[i] === '\\') {
                i++
                str += input[i] || ''
            } else {
                str += input[i]
            }
            i++
        }
        return str
    }

    const parseAtomOrNumber = () => {
        let start = i
        while (i < input.length && /[^\s()]/.test(input[i])) i++
        const token = input.slice(start, i)

        if (!isNaN(token)) {
            return Number(token)
        }

        return sym(token)
    }

    const parseList = () => {
        const list = []
        i++ // skip '('
        while (i < input.length) {
            skipWhitespace()
            if (i >= input.length) break

            if (input[i] === ')') {
                i++
                break
            } else if (input[i] === '(') {
                list.push(parseList())
            } else if (input[i] === '"') {
                list.push(parseString())
            } else {
                list.push(parseAtomOrNumber())
            }
        }
        return list
    }

    const result = []
    while (i < input.length) {
        skipWhitespace()
        if (i >= input.length) break

        if (input[i] === '(') {
            result.push(parseList())
        } else if (input[i] === '"') {
            result.push(parseString())
        } else {
            result.push(parseAtomOrNumber())
        }
    }

    return result
}

export function sexpStringify(sexpr, indent) {
    const pretty = typeof indent === 'number' && indent > 0
    const space = (n) => pretty ? ' '.repeat(indent * n) : ''

    const serializeAtom = (node) => {
        if (isSym(node)) {
            return symName(node)
        }
        if (typeof node === 'string') {
            return `"${node.replace(/(["\\])/g, '\\$1')}"`
        }
        return String(node)
    }

    const serialize = (node, level) => {
        // atom
        if (!Array.isArray(node)) {
            return serializeAtom(node)
        }

        if (node.length === 0) return '()'

        const head = node[0]
        const rest = node.slice(1)

        let out = '(' + serializeAtom(head)
        let i = 0

        // inline atoms after head
        while (i < rest.length && !Array.isArray(rest[i])) {
            out += ' ' + serializeAtom(rest[i])
            i++
        }

        // no pretty-printing or everything fit inline
        if (!pretty || i === rest.length) {
            for (; i < rest.length; i++) {
                out += ' ' + serialize(rest[i], level + 1)
            }
            return out + ')'
        }

        // pretty-print remaining forms
        const lines = rest.slice(i).map(
            n => space(level + 1) + serialize(n, level + 1)
        )

        return (
            out + '\n' +
            lines.join('\n') +
            '\n' +
            space(level) + ')'
        )
    }

    return sexpr.map(node => serialize(node, 0)).join(pretty ? '\n' : ' ')
}