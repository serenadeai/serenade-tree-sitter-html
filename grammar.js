module.exports = grammar({
  name: 'html',

  extras: $ => [
    $.comment,
    /\s+/,
  ],

  externals: $ => [
    $.start_tag_name,
    $.script_start_tag_name,
    $.style_start_tag_name,
    $.end_tag_name,
    $.erroneous_end_tag_name,
    '/>',
    $.implicit_end_tag,
    $.raw_text,
    $.comment,
  ],

  rules: {
    fragment: $ => repeat($._node),

    doctype: $ => seq(
      '<!',
      alias($._doctype, 'doctype'),
      /[^>]+/,
      '>'
    ),

    cdata: $ => seq(
      '<![CDATA[',
      /[^]]+/,
      ']]>'
    ),

    _doctype: $ => /[Dd][Oo][Cc][Tt][Yy][Pp][Ee]/,

    _node: $ => choice(
      $.doctype,
      $.cdata,
      $.text_,
      $.markup_element, 
      $.erroneous_end_tag
    ),

    markup_element: $ => choice(
      $.element,
      $.script_element,
      $.style_element,
    ),

    element: $ => choice(
      seq(
        $.markup_opening_tag,
        optional_with_placeholder('markup_element_content', repeat($._node)),
        choice($.markup_closing_tag, $.implicit_end_tag)
      ),
      $.markup_singleton_tag,
      $.declaration_tag
    ),

    script_element: $ => seq(
      alias($.script_start_tag, $.markup_opening_tag),
      optional_with_placeholder('markup_element_content', $.raw_text),
      // optional($.raw_text),
      $.markup_closing_tag
    ),

    style_element: $ => seq(
      alias($.style_start_tag, $.markup_opening_tag),
      optional_with_placeholder('markup_element_content', $.raw_text),
      // optional($.raw_text),
      $.markup_closing_tag
    ),

    markup_opening_tag: $ => seq(
      '<',
      field('identifier', $.start_tag_name),
      optional_with_placeholder(
        'markup_attribute_list', 
        repeat($.markup_attribute)
      ),
      '>'
    ),

    script_start_tag: $ => seq(
      '<',
      field('identifier', $.script_start_tag_name),
      optional_with_placeholder(
        'markup_attribute_list', 
        repeat($.markup_attribute)
      ),
      '>'
    ),

    style_start_tag: $ => seq(
      '<',
      field('identifier', $.style_start_tag_name),
      optional_with_placeholder(
        'markup_attribute_list', 
        repeat($.markup_attribute)
      ),
      '>'
    ),

    markup_singleton_tag: $ => seq(
      '<',
      field('identifier', $.start_tag_name),
      optional_with_placeholder(
        'markup_attribute_list', 
        repeat($.markup_attribute)
      ),
      '/>'
    ),

    declaration_tag: $ => seq(
      '<?',
      field('identifier', $.start_tag_name),
      optional_with_placeholder(
        'markup_attribute_list', 
        repeat($.markup_attribute)
      ),
      '?>'
    ),

    markup_closing_tag: $ => seq(
      '</',
      field('identifier', $.end_tag_name),
      '>'
    ),

    erroneous_end_tag: $ => field('markup_closing_tag', seq(
      '</',
      field('identifier', $.erroneous_end_tag_name),
      '>'
    )),

    markup_attribute: $ => seq(
      $.markup_attribute_name,
      optional(seq(
        '=',
        field('markup_attribute_value', 
          choice(
            $.attribute_value,
            $.quoted_attribute_value
          )
        )
      ))
    ),

    markup_attribute_name: $ => /[^<>"'/=\s]+/,

    attribute_value: $ => /[^<>"'=\s]+/,

    quoted_attribute_value: $ => choice(
      seq("'", optional(alias(/[^']+/, $.attribute_value)), "'"),
      seq('"', optional(alias(/[^"]+/, $.attribute_value)), '"')
    ),

    text_: $ => /[^<>]+/
  }
});

function optional_with_placeholder(field_name, rule) {
  return choice(field(field_name, rule), field(field_name, blank()))
}
