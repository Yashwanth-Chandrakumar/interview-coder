    
export function formatResponse(response: string): { code: string, text: string } {
    // Remove any <think></think> tags and their content
    const cleanedResponse = response.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
    
    // Extract code blocks (assuming code is within triple backticks)
    const codeBlocks: string[] = [];
    const withoutCodeBlocks = cleanedResponse.replace(/```(?:\w*\n)?([\s\S]*?)```/g, (match, codeContent) => {
      codeBlocks.push(codeContent.trim());
      return "{{CODE_BLOCK_PLACEHOLDER}}";
    });
    
    // Split the remaining text by the placeholders
    const textParts = withoutCodeBlocks.split("{{CODE_BLOCK_PLACEHOLDER}}");
    
    // Combine all text parts, trimming each one
    const textContent = textParts.map(part => part.trim()).filter(part => part).join("\n\n");
    
    // Combine all code blocks
    const codeContent = codeBlocks.join("\n\n");
    
    return {
      code: codeContent,
      text: textContent
    };
  }
  
  /**
   * Renders formatted response in the UI
   * @param container The container element to render the response in
   * @param response The formatted response object
   */
  export function renderFormattedResponse(container: HTMLElement, response: { code: string, text: string }) {
    // Clear the container
    container.innerHTML = '';
    
    // Add text content if present
    if (response.text) {
      const textElement = document.createElement('div');
      textElement.className = 'response-text';
      textElement.innerHTML = response.text
        .split('\n')
        .map(line => `<p>${line}</p>`)
        .join('');
      container.appendChild(textElement);
    }
    
    // Add code content if present
    if (response.code) {
      const codeContainer = document.createElement('div');
      codeContainer.className = 'code-container';
      
      // Add code header
      const codeHeader = document.createElement('div');
      codeHeader.className = 'code-header';
      
      // Add copy button
      const copyButton = document.createElement('button');
      copyButton.textContent = 'Copy Code';
      copyButton.className = 'copy-button';
      copyButton.onclick = () => {
        navigator.clipboard.writeText(response.code);
        copyButton.textContent = 'Copied!';
        setTimeout(() => {
          copyButton.textContent = 'Copy Code';
        }, 2000);
      };
      codeHeader.appendChild(copyButton);
      codeContainer.appendChild(codeHeader);
      
      // Add code content
      const codeElement = document.createElement('pre');
      const codeInner = document.createElement('code');
      codeInner.textContent = response.code;
      codeElement.appendChild(codeInner);
      codeContainer.appendChild(codeElement);
      
      container.appendChild(codeContainer);
    }
  }