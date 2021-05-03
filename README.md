# Table Extended

Extend basic table in Obsidian with MultiMarkdown table syntax.

![20210407084626](https://img.aidenlx.top/picgo/20210407084626.png)

## Intro

Obsidian's [built-in table syntax](https://help.obsidian.md/How+to/Format+your+notes#tables) can only define the basics for tables. When users try to apply complex tables with `colspan` or multiple headers, their only option is to fall back to raw HTML, which is difficult to read and edit.

This plugin brings [MultiMarkdown table syntax][mmd6-table] to Obsidian, which provides the following features with internal links and embeds intact:

- Cell spans over columns
- Cell spans over rows
- Divide rows into sections
- Multiple table headers
- Table caption
- Block-level elements such as lists, codes...
- Omitted table header

[mmd6]: https://fletcher.github.io/MultiMarkdown-6/
[mdit]: https://markdown-it.github.io/
[mmdt]: https://github.com/RedBug312/markdown-it-multimd-table

## Known issue

This plugin is not yet compatible with [Advanced Tables](https://github.com/tgrosinger/advanced-tables-obsidian), as its auto-formatting would break the mmd6 table syntax. 

Related issue: [advanced-tables-obsidian #59](https://github.com/tgrosinger/advanced-tables-obsidian/issues/59#issuecomment-812886995)

## How to use

Due to the API restrictions, the texts need to be included inside fenced code blocks specified to language `tx` for the plugin to handle. For example: 

    ```tx
    |             |          Grouping           || 
    First Header  | Second Header | Third Header | 
     ------------ | :-----------: | -----------: | 
    Content       |          *Long Cell*        || 
    Content       |   **Cell**    |         Cell | 
                                                   
    New section   |     More      |         Data | 
    And more      | With an escaped '\|'       || 
    [Prototype table]
    ```

would be render as: 

<div class="block-language-tx"><table>
<caption id="prototypetable">Prototype table</caption>
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

For more detailed guide, check [markdown-it-multimd-table README](mmdtg) and [MultiMarkdown User's Guide][mmd6-table]

[mmdtg]: https://github.com/RedBug312/markdown-it-multimd-table/blob/master/README.md#usage
[mmd6-table]: https://fletcher.github.io/MultiMarkdown-6/syntax/tables.html

## Compatibility

The required API feature is only available for Obsidian v${min}+.

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

Due to the restriction of the current Obsidian API, the built-in markdown parser is not configurable. Instead, This plugin includes an standalone Markdown parser [markdown-it][mdit] with plugin[markdown-it-multimd-table][mmdt], and only the texts inside code block with language tag `tx` are passed to `markdown-it`. The internal links and embeds, however, are extracted and passed to Obsidian, so the core features of obsidian remain intact.

Noted that the plugin may behave differently from the official MultiMarkdown compiler and Obsidian's parser, Please pose an issue if there are unexpected results for sensible inputs. 