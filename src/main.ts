import { Schema, DOMParser, Node as PMNode, DOMSerializer } from 'prosemirror-model'
import { schema } from 'prosemirror-schema-basic'
import { addListNodes } from 'prosemirror-schema-list'
import { EditorState } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import { exampleSetup } from 'prosemirror-example-setup'
import './style.css'
import { InputRule, inputRules, wrappingInputRule } from 'prosemirror-inputrules'
const DataType = 'MentionNode'
// Mix the nodes from prosemirror-schema-list into the basic schema to
// create a schema with list support.
const mySchema = new Schema({
  nodes: addListNodes(schema.spec.nodes, 'paragraph block*', 'block').addToEnd(
    'mention',
    {
      // inline: true,
      attrs: {
        id: {},
        displayName: {
          // 由于一开始存在过没有 displayName 的版本，所以这里为了适配要提供默认空值
          default: '',
        },
      },
      draggable: true,
      group: 'inline',
      inline: true,
      parseDOM: [
        {
          tag: `a[data-type=${DataType}]`,
          getAttrs(dom: Node) {
            if (!(dom instanceof HTMLElement)) return
            return {
              id: dom.dataset.id,
              displayName: dom.dataset.displayName ?? '',
            }
          },
        },
      ],
      toDOM(node: PMNode) {
        const { id, displayName } = node.attrs
        return [
          'a',
          {
            'data-type': DataType,
            'data-id': id,
            'data-display-name': displayName,
            target: '_blank',
          },
        ]
      },
    }
  ),
  // nodes:{doc: schema.spec.nodes.doc},
  marks: schema.spec.marks,
})

const view = new EditorView(document.querySelector('#editor')!, {
  state: EditorState.create({
    doc: DOMParser.fromSchema(mySchema).parse(document.querySelector('#content')!),
    plugins: [
      ...exampleSetup({ schema: mySchema }),
      inputRules({
        rules: [
          new InputRule(/^(@*)(\w*)\s$/, (state, match, start, end) => {
            const { tr } = state
            const displayName = match[2]

            tr.replaceWith(start - 1, end, [
              mySchema.nodes.mention.create({
                id: '123123',
                displayName,
              }),
              mySchema.text(' '),
            ])
            return tr
          }),
        ],
      }),
    ],
  }),
  nodeViews: {
    mention(node, view) {
      const schema: Schema = view.state.schema
      const { dom } = DOMSerializer.renderSpec(
        document,
        schema.nodes.mention.spec.toDOM!(node)
      )

      if (!(dom instanceof HTMLElement)) {
        throw new Error('Mention root node type error')
      }

      if (dom instanceof HTMLElement) {
        const attrs = node.attrs
        setTimeout(()=>{
          dom.textContent = `${attrs.displayName}`
        },0)
      }
      return { dom }
    },
  },
})

// setTimeout(() => {
//   const tr = view.state.tr
//   tr.insert(
//     view.state.doc.content.size,
//     mySchema.nodes.mention.create({
//       id: '123123',
//       displayName: '高超',
//     })
//   )
//   view.dispatch(tr)
// }, 1000)
