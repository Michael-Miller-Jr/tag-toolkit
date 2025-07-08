(function() {
    let scriptsMeta = '';
    let scriptsResults = '';
    let metaIndex = 1;
    let scriptIndex = 1;

    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function captureInitialTags() {
        // Capture all current meta tags first, then script tags with numbering
        document.querySelectorAll('meta').forEach(meta => {
            scriptsMeta += `<pre><strong>${metaIndex++}.</strong> ${escapeHtml(meta.outerHTML)}</pre>`;
        });

        document.querySelectorAll('script').forEach(script => {
            scriptsMeta += `<pre><strong>${scriptIndex++}.</strong> ${escapeHtml(script.outerHTML)}</pre>`;
        });
    }

    // Initial capture of existing script and meta tags
    captureInitialTags();

    // Observe the entire document for any added or modified script tags
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach(node => {
                    if (node.tagName === 'SCRIPT') {
                        scriptsResults += `<pre><strong>${scriptIndex++}.</strong> ${escapeHtml(node.outerHTML)}</pre>`;
                    }
                    if (node.tagName === 'META') {
                        scriptsMeta += `<pre><strong>${metaIndex++}.</strong> ${escapeHtml(node.outerHTML)}</pre>`;
                    }
                });
            }
        });
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });

    window.addEventListener('load', () => {
        // Stop observing once the page load is complete
        setTimeout(() => {
            observer.disconnect();
            
            // Send the captured data back to the popup script
            chrome.runtime.sendMessage({
                action: 'updateResults',
                data: { scriptsMeta, scriptsResults }
            });
        }, 5000); // Allow some extra time for late-loading scripts
    });
})();
