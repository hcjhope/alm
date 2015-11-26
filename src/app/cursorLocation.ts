/**
 * Singleton that maintains the cursor history
 */
import * as commands from "./commands/commands";
import * as utils from "../common/utils";
import * as state from "./state/state";

/** The current cursor location */
let currentIndex = -1;
let history: CursorHistoryEntry[] = [];
const tooMany = 200;

/** Subscribe to user requests to move around */
commands.previousCursorLocation.on(() => {
    previous();
});
commands.nextCursorLocation.on(() => {
    next();
});

interface CursorHistoryEntry {
    tabId: string;
    tabUrl: string; // for a possible future extension where we open the tabUrl if tabId is no longer valid
    position: EditorPosition;
}

export function previous() {
    console.log('goto previous');
    currentIndex = utils.rangeLimited({ min: 0, max: history.length - 1, num: currentIndex - 1 });
    let tab = history[currentIndex];
    if (tab) {
        commands.doOpenOrFocusTab.emit({ tabId: tab.tabId, tabUrl: tab.tabUrl, position: tab.position });
    }
}

export function next() {
    console.log('goto next');
    currentIndex = utils.rangeLimited({ min: 0, max: history.length - 1, num: currentIndex + 1 });
    let tab = history[currentIndex];
    if (tab) {
        commands.doOpenOrFocusTab.emit({ tabId: tab.tabId, tabUrl: tab.tabUrl, position: tab.position });
    }
}


/**
 * The current tab with id is fetched from state. So all you need is editorPosition
 */
export function addEntry(editorPosition: EditorPosition) {
    let selectedTab = state.getSelectedTab();
    if (!selectedTab) {
        console.error('adding a cursor history should not have been called if there is no active tab');
        return;
    }
    if (!selectedTab.url.startsWith('file://')) {
        console.error('adding a cursor history should not have been called if active tab is not a filePath');
        return;
    }

    // let currentEntryIsLast = (history.length - 1) == currentIndex;

    let potentialNewEntry: CursorHistoryEntry = {
        tabId: selectedTab.id,
        tabUrl: selectedTab.url,
        position: editorPosition
    }

    // This prevents us adding a new history for what we already know e.g. when we ask the UI to select a tab
    let lastActiveEntry = history[currentIndex];
    if (lastActiveEntry && lastActiveEntry.tabId == potentialNewEntry.tabId) {
        if (editorPosition.line == lastActiveEntry.position.line && editorPosition.ch == lastActiveEntry.position.ch) {
            return;
        }
    }

    currentIndex++;
    history.splice(currentIndex, 0, potentialNewEntry);

    // If too many:
    if (history.length >= tooMany) {
        // if at end we remove items from the start
        if (currentIndex == history.length - 1) {
            history.shift();
            currentIndex--;
        }
        // if in the middle we remove items from the end
        else {
            history.pop();
        }
    }

    // console.log('Adding',potentialNewEntry.tabUrl,potentialNewEntry.position.line,potentialNewEntry.position.ch); // Debug
    // console.log(currentIndex,history); // Debug
}