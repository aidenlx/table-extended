# Table Extended

Extend basic table in Obsidian with MultiMarkdown table syntax.

![20210407084626](https://img.aidenlx.top/picgo/20210407084626.png)

## Intro

Obsidian's [built-in table syntax](https://help.obsidian.md/How+to/Format+your+notes#tables) can only define the basics for tables. When users try to apply complex tables with `colspan` or multiple headers, their only option is to fall back to raw HTML, which is difficult to read and edit.

This plugin brings [MultiMarkdown table syntax][mmd6-table] to Obsidian, which provides the following features with internal links and embeds intact:

- [Cell spans over columns](#colspan)
- [Cell spans over rows](#rowspan)
- [Block-level elements](#multiline) such as lists, codes...
- [Multiple table headers](#multiline-header) (only supported in `tx` code block)
- Table caption (only supported in `tx` code block)
- [Omitted table header](#headerless) (only supported in `tx` code block)

[mmd6]: https://fletcher.github.io/MultiMarkdown-6/
[mdit]: https://markdown-it.github.io/
[mmdt]: https://github.com/RedBug312/markdown-it-multimd-table

## Known issue

- This plugin is not yet compatible with [Advanced Tables](https://github.com/tgrosinger/advanced-tables-obsidian), as its auto-formatting would break the mmd6 table syntax.
  - Related issue: [advanced-tables-obsidian #59](https://github.com/tgrosinger/advanced-tables-obsidian/issues/59#issuecomment-812886995)
- backlinks and forward links are disabled in `tx` codeblock
  - Related issue: [
Internal Links inside code block wont create backlinks](https://forum.obsidian.md/t/internal-links-inside-code-block-wont-create-backlinks/12288)

## How to use

With plugin installed, extended syntax is allowed in Obsidian's regular tables:

The following table:

```md
First Header  | Second Header | Third Header |
 ------------ | :-----------: | -----------: |
Content       |          *Long Cell*        ||
Content       |   **Cell**    |         Cell |
New section   |     More      |         Data |
And more      | With an escaped '\|'       ||
```

would be render as:

<div class="block-language-tx"><table>
<thead>
<tr>
<th>First Header</th>
<th style="text-align:center">Second Header</th>
<th style="text-align:right">Third Header</th>
</tr>
</thead>
<tbody>
<tr>
<td>Content</td>
<td style="text-align:center" colspan="2"><em>Long Cell</em></td>
</tr>
<tr>
<td>Content</td>
<td style="text-align:center"><strong>Cell</strong></td>
<td style="text-align:right">Cell</td>
</tr>
</tbody>
<tbody>
<tr>
<td>New section</td>
<td style="text-align:center">More</td>
<td style="text-align:right">Data</td>
</tr>
<tr>
<td>And more</td>
<td style="text-align:center" colspan="2">With an escaped '|'</td>
</tr>
</tbody>
</table>
</div>

For more detailed guide, check [markdown-it-multimd-table README][mmdtg] and [MultiMarkdown User's Guide][mmd6-table]

[mmdtg]: https://github.com/RedBug312/markdown-it-multimd-table/blob/master/README.md#usage
[mmd6-table]: https://fletcher.github.io/MultiMarkdown-6/syntax/tables.html

### Multiline

Backslash at end merges with line content below.

```markdown
|   Markdown   | Rendered HTML |
|--------------|---------------|
|    *Italic*  | *Italic*      | \
|              |               |
|    - Item 1  | - Item 1      | \
|    - Item 2  | - Item 2      |
|    ```python | ```python       \
|    .1 + .2   | .1 + .2         \
|    ```       | ```           |
```

This is parsed below: 

<table>
<thead>
<tr>
<th>Markdown</th>
<th>Rendered HTML</th>
</tr>
</thead>
<tbody>
<tr>
<td>
<pre><code>*Italic*
</code></pre>
</td>
<td>
<p><em>Italic</em></p>
</td>
</tr>
<tr>
<td>
<pre><code>- Item 1
- Item 2</code></pre>
</td>
<td>
<ul>
<li>Item 1</li>
<li>Item 2</li>
</ul>
</td>
</tr>
<tr>
<td>
<pre><code>```python
.1 + .2
```</code></pre>
</td>
<td>
<pre><code class="language-python">.1 + .2
</code></pre>
</td>
</tr>
</tbody>
</table>

### Rowspan

`^^` indicates cells being merged above.<br>
Feature contributed by [pmccloghrylaing](https://github.com/pmccloghrylaing).

```markdown
Stage | Direct Products | ATP Yields
----: | --------------: | ---------:
Glycolysis | 2 ATP ||
^^ | 2 NADH | 3--5 ATP |
Pyruvaye oxidation | 2 NADH | 5 ATP |
Citric acid cycle | 2 ATP ||
^^ | 6 NADH | 15 ATP |
^^ | 2 FADH2 | 3 ATP |
**30--32** ATP |||
```

This is parsed below:

<table>
<thead>
<tr>
<th align="right">Stage</th>
<th align="right">Direct Products</th>
<th align="right">ATP Yields</th>
</tr>
</thead>
<tbody>
<tr>
<td align="right" rowspan="2">Glycolysis</td>
<td align="right" colspan="2">2 ATP</td>
</tr>
<tr>
<td align="right">2 NADH</td>
<td align="right">3–5 ATP</td>
</tr>
<tr>
<td align="right">Pyruvaye oxidation</td>
<td align="right">2 NADH</td>
<td align="right">5 ATP</td>
</tr>
<tr>
<td align="right" rowspan="3">Citric acid cycle</td>
<td align="right" colspan="2">2 ATP</td>
</tr>
<tr>
<td align="right">6 NADH</td>
<td align="right">15 ATP</td>
</tr>
<tr>
<td align="right">2 FADH2</td>
<td align="right">3 ATP</td>
</tr>
<tr>
<td align="right" colspan="3"><strong>30–32</strong> ATP</td>
</tr>
</tbody>
</table>

### Multiline Header

Note: only supported in `tx` code block

```tx
|             |          Grouping           ||
First Header  | Second Header | Third Header |
 ------------ | :-----------: | -----------: |
Content       |          *Long Cell*        ||
```

rendered as:
<div class="block-language-tx"><table>
<thead>
<tr>
<th></th>
<th style="text-align:center" colspan="2">Grouping</th>
</tr>
<tr>
<th>First Header</th>
<th style="text-align:center">Second Header</th>
<th style="text-align:right">Third Header</th>
</tr>
</thead>
<tbody>
<tr>
<td>Content</td>
<td style="text-align:center" colspan="2"><em>Long Cell</em></td>
</tr>
</tbody>
</table>
</div>

### Headerless

Table header can be eliminated.
Note: only supported in `tx` code block

```markdown
|--|--|--|--|--|--|--|--|
|♜|  |♝|♛|♚|♝|♞|♜|
|  |♟|♟|♟|  |♟|♟|♟|
|♟|  |♞|  |  |  |  |  |
|  |♗|  |  |♟|  |  |  |
|  |  |  |  |♙|  |  |  |
|  |  |  |  |  |♘|  |  |
|♙|♙|♙|♙|  |♙|♙|♙|
|♖|♘|♗|♕|♔|  |  |♖|
```

This is parsed below:

<table>
<tbody>
<tr>
<td>♜</td>
<td></td>
<td>♝</td>
<td>♛</td>
<td>♚</td>
<td>♝</td>
<td>♞</td>
<td>♜</td>
</tr>
<tr>
<td></td>
<td>♟</td>
<td>♟</td>
<td>♟</td>
<td></td>
<td>♟</td>
<td>♟</td>
<td>♟</td>
</tr>
<tr>
<td>♟</td>
<td></td>
<td>♞</td>
<td></td>
<td></td>
<td></td>
<td></td>
<td></td>
</tr>
<tr>
<td></td>
<td>♗</td>
<td></td>
<td></td>
<td>♟</td>
<td></td>
<td></td>
<td></td>
</tr>
<tr>
<td></td>
<td></td>
<td></td>
<td></td>
<td>♙</td>
<td></td>
<td></td>
<td></td>
</tr>
<tr>
<td></td>
<td></td>
<td></td>
<td></td>
<td></td>
<td>♘</td>
<td></td>
<td></td>
</tr>
<tr>
<td>♙</td>
<td>♙</td>
<td>♙</td>
<td>♙</td>
<td></td>
<td>♙</td>
<td>♙</td>
<td>♙</td>
</tr>
<tr>
<td>♖</td>
<td>♘</td>
<td>♗</td>
<td>♕</td>
<td>♔</td>
<td></td>
<td></td>
<td>♖</td>
</tr>
</tbody>
</table>

## Compatibility

The required API feature is only available for Obsidian v0.10.12+.

## Installation

### From Obsidian

1. Open `Settings` > `Third-party plugin`
2. Make sure Safe mode is **off**
3. Click `Browse community plugins`
4. Search for this plugin
5. Click `Install`
6. Once installed, close the community plugins window and the patch is ready to use.

### From GitHub

1. Download the Latest Release from the Releases section of the GitHub Repository
2. Put files to your vault's plugins folder: `<vault>/.obsidian/plugins/table-extended`
3. Reload Obsidian
4. If prompted about Safe Mode, you can disable safe mode and enable the plugin.
   Otherwise, head to Settings, third-party plugins, make sure safe mode is off and
   enable the plugin from there.

> Note: The `.obsidian` folder may be hidden. On macOS, you should be able to press `Command+Shift+Dot` to show the folder in Finder.

## Behind the scene

Due to the restriction of the current Obsidian API, the built-in markdown parser is not configurable. Instead, This plugin includes an standalone Markdown parser [markdown-it][mdit] with plugin[markdown-it-multimd-table][mmdt], and table sections and the texts inside code block with language tag `tx` are passed to `markdown-it`. The internal links and embeds, however, are extracted and passed to Obsidian, so the core features of obsidian remain intact.

Noted that the plugin may behave differently from the official MultiMarkdown compiler and Obsidian's parser, Please pose an issue if there are unexpected results for sensible inputs.
