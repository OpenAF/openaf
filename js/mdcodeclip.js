// Markdown code block copy button
// Copyright 2025 Nuno Aguiar

var _style = `
  <style>
    .copy-button {
      position: absolute;
      top: 0px;
      right: 0;
      background: transparent;
      border: none;
      cursor: pointer;
      padding-left: 16x;
      padding-right: 16px;
      padding-top: 8px;
      padding-bottom: 8px;
      margin: 0;
    }
    .copy-button .icon {
      width: 16px;
      height: 16px;
      display: block;
    }
  </style>
   `
// Bootstrap Icons. MIT License: https://github.com/twbs/icons/blob/main/LICENSE.md
var _copysym = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="icon" viewBox="0 0 16 16">
  <path d="M3.5 2a.5.5 0 0 0-.5.5v12a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5v-12a.5.5 0 0 0-.5-.5H12a.5.5 0 0 1 0-1h.5A1.5 1.5 0 0 1 14 2.5v12a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 14.5v-12A1.5 1.5 0 0 1 3.5 1H4a.5.5 0 0 1 0 1z"/>
  <path d="M10 .5a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5.5.5 0 0 1-.5.5.5.5 0 0 0-.5.5V2a.5.5 0 0 0 .5.5h5A.5.5 0 0 0 11 2v-.5a.5.5 0 0 0-.5-.5.5.5 0 0 1-.5-.5"/>
</svg>`
   
// Bootstrap Icons. MIT License: https://github.com/twbs/icons/blob/main/LICENSE.md
var _copiedsym = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="icon" viewBox="0 0 16 16">
  <path d="M10 .5a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5.5.5 0 0 1-.5.5.5.5 0 0 0-.5.5V2a.5.5 0 0 0 .5.5h5A.5.5 0 0 0 11 2v-.5a.5.5 0 0 0-.5-.5.5.5 0 0 1-.5-.5"/>
  <path d="M4.085 1H3.5A1.5 1.5 0 0 0 2 2.5v12A1.5 1.5 0 0 0 3.5 16h9a1.5 1.5 0 0 0 1.5-1.5v-12A1.5 1.5 0 0 0 12.5 1h-.585q.084.236.085.5V2a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 4 2v-.5q.001-.264.085-.5m6.769 6.854-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 9.793l2.646-2.647a.5.5 0 0 1 .708.708"/>
</svg>`

document.addEventListener("DOMContentLoaded", function () {
    var svgContainer = document.createElement("svg")
    svgContainer.style.display = "none"
    svgContainer.innerHTML = _style
    document.body.insertBefore(svgContainer, document.body.firstChild)

    // For each <pre> element that contains code, add a copy button.
    document.querySelectorAll("pre").forEach(function (pre) {
        // Ensure the <pre> is positioned relatively so the button can be placed inside it.
        pre.style.position = "relative"

        // Create the copy button.
        var copyButton = document.createElement("button")
        copyButton.className = "copy-button"
        copyButton.innerHTML = _copysym
        copyButton.style.display = "none"

        // Append the button to the <pre> element.
        pre.appendChild(copyButton)

        // Show the button on hover.
        pre.addEventListener("mouseenter", function () { copyButton.style.display = "block" })
        pre.addEventListener("mouseleave", function () { copyButton.style.display = "none" })

        // For touch devices, show the button on touch.
        pre.addEventListener("touchstart", function () {
            copyButton.style.display = "block"
            // Optionally, hide it after a delay:
            setTimeout(function () {
                copyButton.style.display = "none"
            }, 2000)
        });

        // When the button is clicked, copy the code text.
        copyButton.addEventListener("click", function (event) {
            // Prevent any other click event.
            event.stopPropagation()

            // Get the text content from the <code> element.
            var codeElement = pre.querySelector("code")
            var codeText = codeElement.innerText

            // Use the Clipboard API if available and in a secure context.
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(codeText).then(function () {
                    copyButton.innerHTML = _copiedsym
                    setTimeout(function () {
                        copyButton.innerHTML = _copysym
                        setTimeout(function() {
                            copyButton.style.display = "none"
                        }, 250) 
                    }, 750)
                }, function (err) {
                    console.error("Error copying text: ", err)
                })
            } else {
                // Fallback method using a temporary textarea and document.execCommand.
                var textArea = document.createElement("textarea")
                textArea.value = codeText
                // Avoid scrolling to the bottom of the page.
                textArea.style.position = "fixed"
                textArea.style.top = 0
                textArea.style.left = 0
                textArea.style.opacity = 0
                document.body.appendChild(textArea)
                textArea.focus()
                textArea.select()

                try {
                    var successful = document.execCommand("copy")
                    if (successful) {
                        copyButton.innerHTML = _copiedsym
                        setTimeout(function () {
                            copyButton.innerHTML = _copysym
                            setTimeout(function() {
                                copyButton.style.display = "none"
                            }, 250) 
                        }, 750)
                    }
                } catch (err) {
                    console.error("Fallback copy failed", err)
                }
                document.body.removeChild(textArea)
            }
        })
    })
})
