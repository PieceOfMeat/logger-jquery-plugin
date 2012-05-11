## jquery.logger

Logging component for jQuery with ability to classify log messages by importance level and topic

### Features

  - Any number of logging levels
  - Any number of logging topics
  - Any number of viewing components with individual filters by logging level and topic
  - Ability to add own viewing components

### Usage

Before using logger module, one or more viewing components must be added to logger, as described below. `$.log(message, level, topic)` will transmit message to all views which filters allow specified level and topic.

`level` or `topic` parameters can be omitted

### Options

Plugin options are stored in `$.log.options` object:

<table>
<tr>
  <th>Option</th>
  <th>Description</th>
  <th>Default</th>
</tr>

<tr>
  <td>loggingLevels</td>
  <td>List of available logging levels from low to high priority. You can change this like any other options, but if you want to get proper aliases for logging levels, you must use $.log.setLoggingLevels() instead. Note, that changing of logging levels list must be done before creating viewing components, because they create filters depending on actual levels list</td>
  <td>['debug', 'info', 'warn', 'error']</td>
</tr>

<tr>
  <td>defaultLoggingLevel</td>
  <td>If you use $.log() function without specifying logging level, defaultLoggingLevel will be used as default</td>
  <td>'info'</td>
</tr>

<tr>
  <td>defaultLevelFilter</td>
  <td>Default level filter for any new viewer</td>
  <td>'info'</td>
</tr>

<tr>
  <td>defaultTopicFilter</td>
  <td>Default topic filter for any new viewer</td>
  <td>['*']</td>
</tr>
</table>

You can redefine any of plugin options:

    $.extend($.log.options, {
        defaultLoggingLevel: 'warn',
        defaultLevelFilter: 'debug'
    });

### Logging levels

Initially there is four predefined logging levels listed from low to high priority: debug, info, warn, error. Level is described by simple id string. For each of these levels exists alias function:

    $.log.debug(message, topic)
    $.log.info(message, topic)
    $.log.warn(message, topic)
    $.log.error(message, topic)

You can change logging levels list by changing `$.log.options.loggingLevels` option, but if you want logger to create convenient aliases for them, you must use function

    $.log.setLoggingLevels(levels);

where `levels` is a new list of level ids from low to high priority. Level id is an unique string containing latin letters or digits, without whitespaces.

### Topics

`topic` parameter is optional in `$.log()` function and alias functions. If it is owitted, `$.log.options.defaultTopic` (by default 'raw') will be used to separate other topics from "raw" logging messages. Some viewers separate different topics into different blocks, some provide filters to analyze logs by topic.

When creating new viewer, we can specify its topic filter. Filter is an array of plain strings representing allowed topics. Default filter is ['*'], which passes all topics. We can build hierarchy of topics depending on logical structure of our system. Each level is separated by dot. For example, if we have module with several submodules we can have following topics hierarchy:

    Module => 'module_name'
    Submodule1 => 'module_name.submodule_1_name'
    Submodule2 => 'module_name.submodule_2_name'
    Submodule3 => 'module_name.submodule_3_name'
    Submodule3.Submodule3_1 => 'module_name.submodule_3_name.submodule_3_1_Name'

Then we can specify filter `['submodule_2_name', 'submodule_3_name']` for logging only Submodule2, Submodule3 and Submodule3.Submodule3_1, or we can use `[module_name]` filter for logging module with all its submodules.

### Viewing components

Logger module provides several types of viewing components. We can specify any number of views with their own logging level and topic filters. For example, we can add one view which pass warnings and errors of topic1 into console, and another view passing topic2 debug (and more foreground) messages into separate window.

`$.log.views` is a special object representing all viewers available in module. When creating new viewer, we specify one of keys of `$.log.views` as type of viewer.

#### Viewers
<table>
<tr>
  <th>Type</th>
  <th>Description</th>
</tr>
<tr>
  <td>console</td>
  <td>Pass messages into browser console using standart console object. If message has debug, info, warn or error level, corresponding console functions are used. In other case console.log is used.</td>
</tr>
<tr>
  <td>pageList</td>
  <td>Append log messages one-by-one to particular block on the page. This block will contain two selectors for filtering messages by level and topic</td>
</tr>
<tr>
  <td>pageTopics</td>
  <td>Append log messages separating them by topics.</td>
</tr>
<tr>
  <td>window</td>
  <td>Opens new window and adds one of page viewers (pageList of pageTopics) to it.</td>
</tr>
</table>


`$.log.addView(options, viewerId)` adds new viewer

`$.log.deleteView(viewerId)` deletes specified viewer from viewers set

`viewerId` is any string to identify new viewer. `viewerId` is optional, if omitted, system will generate it itself. `$.log.addView()` returns ID of created view, so we can save it and delete viewer later with `$.log.deleteView()` function.

<table>
<tr>
  <th>Option</th>
  <th>Description</th>
  <th>Default</th>
</tr>
<tr>
  <td>type</td>
  <td>Type of viewer. Must be one of viewers types.</td>
  <td></td>
</tr>
<tr>
  <td>levelFilter</td>
  <td>Filter by message priority level. Viewer will accumulate messages having priority greater or equal to specified level.</td>
  <td>$.log.options.defaultLevelFilter</td>
</tr>
<tr>
  <td>levelFilter</td>
  <td>Filter by topic. Topic filters was described in section "Topics".</td>
  <td>$.log.options.defaultTopicFilter</td>
</tr>
<tr>
  <td>block</td>
  <td>jQuery object representing existing block on page. This is needed when creating page viewers.</td>
  <td></td>
</tr>
<tr>
  <td>cssFile</td>
  <td>Absolute path to logger.css file when using window viewer. This is nesessary if you want styled output in separate window.</td>
  <td></td>
</tr>
<tr>
  <td>pageViewer</td>
  <td>When creating window viewer, we must specify type og page viewer which will be placed in created window</td>
  <td></td>
</tr>
</table>


### Examples

    // this will create 6 alias functions
    $.log.setLoggingLevels(['debug', 'info', 'medium', 'warn', 'error', 'fatal_error']);


    // This view will accumulate only warn, error and fatal_error messages from all topics
    $.log.addView({
        type: 'pageTopics',
        block: $('#log'),
        levelFilter: 'warn'
    });

    // This view will accumulate all 'info' and higher messages from topic 'core_system' in separate window
    // with ability for filtering provided by pageList
    $.log.addView({
        type: 'window',
        pageViewer: 'pageList',
        levelFilter: 'info',
        topicFilter: ['core_system']
    });

    $.log('message 1', 'core_system'); // level: 'info', topic: 'core_system'
    $.log.fatal_error('fatal error 1'); // level: 'fatal_error', topic: 'raw'
    $.log('warning 1', 'warn'); // level: 'warn', topic: 'raw'

### Adding new viewer types

You can extend set of available viewers simply adding new viewer constructor to `$.log.views` object. Object created by this constructor must have `output(message, level, topic)` function, which will be automatically invoked when new message is received by logger and its level and topic satisfies viewer filters.
Arguments of `output` function:
`message` - actual message
`level` - level of message
`topic` - topic of message