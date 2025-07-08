document.addEventListener('DOMContentLoaded', () => {
    const scriptsTab = document.getElementById('tab-scripts');
    const resultsTab = document.getElementById('tab-results');
    const contentScripts = document.getElementById('content-scripts');
    const contentResults = document.getElementById('content-results');
    const analysisResults = document.getElementById('analysis-results');
    const downloadResults = document.getElementById('download-results');
    const startAnalysis = document.getElementById('start-analysis');
    const reloadPage = document.getElementById('reload-page');
    const searchBox = document.getElementById('search-box');
    const gtmIcon = document.getElementById('gtm-icon');
    const gaIcon = document.getElementById('ga-icon');

    scriptsTab.addEventListener('click', () => {
        showTab(scriptsTab, contentScripts);
    });

    resultsTab.addEventListener('click', () => {
        showTab(resultsTab, contentResults);
    });

    startAnalysis.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tabId = tabs[0].id;

            analysisResults.innerHTML = '';
            contentResults.innerHTML = '';

            chrome.scripting.executeScript({
                target: { tabId: tabId },
                files: ['content.js']
            });
        });
    });

    reloadPage.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tabId = tabs[0].id;
            chrome.tabs.reload(tabId);
        });
    });

    searchBox.addEventListener('input', () => {
        const query = searchBox.value.toLowerCase();
        filterResults(query, analysisResults);
        filterResults(query, contentResults);
    });

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'updateResults') {
            const { scriptsMeta, scriptsResults } = message.data;

            if (scriptsMeta) {
                analysisResults.innerHTML = scriptsMeta;
            }

            if (scriptsResults) {
                resultsTab.disabled = false;
                downloadResults.disabled = false;
                contentResults.innerHTML = scriptsResults;
            }

            // Check for GTM and Google Analytics in the results
            checkForScripts([scriptsMeta, scriptsResults]);
        }
    });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0].id;
        loadResults(tabId);
    });

    function loadResults(tabId) {
        chrome.storage.local.get(['tabData'], (data) => {
            if (data.tabData && data.tabData[tabId]) {
                const { scriptsMeta, scriptsResults } = data.tabData[tabId];

                if (scriptsMeta) {
                    analysisResults.innerHTML = scriptsMeta;
                } else {
                    analysisResults.innerHTML = "<p align='center'>No data available for this tab. Click Start Analysis then Reload Page to begin.</p>";
                    contentResults.innerHTML = "<p align='center'>No data available for this tab. Click Start Analysis then Reload Page to begin.</p>";
                }

                if (scriptsResults) {
                    resultsTab.disabled = false;
                    downloadResults.disabled = false;
                    contentResults.innerHTML = scriptsResults;
                } else {
                    contentResults.innerHTML = "<p align='center'>No dynamic scripts detected.</p>";
                }

                // Check for GTM and Google Analytics in the results
                checkForScripts([scriptsMeta, scriptsResults]);
            } else {
                analysisResults.innerHTML = "<p align='center'>No data available for this tab. Click Start Analysis then Reload Page to begin.</p>";
                contentResults.innerHTML = "<p align='center'>No data available for this tab. Click Start Analysis then Reload Page to begin.</p>";
            }
        });
    }

    downloadResults.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tabId = tabs[0].id;

            chrome.storage.local.get(['tabData'], (data) => {
                if (data.tabData && data.tabData[tabId]) {
                    const blob = new Blob([data.tabData[tabId].scriptsResults], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'script_results.txt';
                    a.click();
                    URL.revokeObjectURL(url);
                }
            });
        });
    });

    function showTab(tab, content) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        content.classList.add('active');
    }

    function filterResults(query, element) {
        const items = element.querySelectorAll('pre');
        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            if (text.includes(query)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    }

    function checkForScripts(results) {
        let gtmFound = false;
        let gaFound = false;
    
        results.forEach(result => {
            if (result.includes('googletagmanager.com') || result.includes('gtm.js')) {
                gtmFound = true;
            }
            if (result.includes('google-analytics.com') || result.includes('analytics.js')) {
                gaFound = true;
            }
        });
    
        if (gtmFound) {
            gtmIcon.src = "icons/gtm-icon.png"; // Full color icon when detected
            gtmIcon.title = "Google Tag Manager: Detected";
        } else {
            gtmIcon.src = "icons/gtm-notdetected-icon.png"; // Faded icon when not detected
            gtmIcon.title = "Google Tag Manager: Not Detected";
        }
    
        if (gaFound) {
            gaIcon.src = "icons/ga-icon.png"; // Full color icon when detected
            gaIcon.title = "Google Analytics: Detected";
        } else {
            gaIcon.src = "icons/ga-notdetected-icon.png"; // Faded icon when not detected
            gaIcon.title = "Google Analytics: Not Detected";
        }
    }    
});
