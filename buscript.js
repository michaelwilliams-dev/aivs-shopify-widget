
// 📦 Updated to use aivs-coffee-backend.onrender.com


(function () {
	const container = document.getElementById('assistant-container');
	
	// === Style the container ===
	container.style.maxWidth = '600px';
	container.style.margin = '20px auto';
	container.style.padding = '20px';
	container.style.border = '1px solid #ddd';
	container.style.borderRadius = '10px';
	container.style.backgroundColor = '#fff';
	container.style.fontFamily = 'sans-serif';
	
	// === Heading ===
	const heading = document.createElement('h2');
	heading.innerText = '☕ AI Coffee Shop Assistant';
	container.appendChild(heading);
  
	// === Form ===
	const form = document.createElement('form');
	form.id = 'ask-form';
  
	const textarea = document.createElement('textarea');
	textarea.id = 'question';
	textarea.placeholder = 'Ask any question about Coffee...';
	textarea.style.width = '100%';
	textarea.style.height = '80px';
	textarea.style.margin = '10px 0';
	textarea.required = true;
  
	const emailInput = document.createElement('input');
	emailInput.type = 'email';
	emailInput.placeholder = 'Your email (optional)';
	emailInput.style.width = '100%';
	emailInput.style.margin = '10px 0';
	emailInput.style.padding = '8px';
  
	const button = document.createElement('button');
	button.type = 'submit';
	button.innerText = 'Ask';
	button.style.padding = '10px 20px';
	button.style.backgroundColor = '#7b4e2e';
	button.style.color = '#fff';
	button.style.border = 'none';
	button.style.borderRadius = '4px';
	button.style.cursor = 'pointer';
  
	const pre = document.createElement('pre');
	pre.id = 'response';
	pre.innerText = '🧠 Your response will appear here.';
	pre.style.background = '#f9f9f9';
	pre.style.padding = '10px';
	pre.style.marginTop = '20px';
	pre.style.whiteSpace = 'pre-wrap';
  
	// === Handle form submission ===
	form.onsubmit = async (e) => {
	  e.preventDefault();
	  const question = textarea.value.trim();
	  const email = emailInput.value.trim();
	  if (!question) return;
  
	  pre.innerText = '⏳ Coffee Assistant is searching...';
  
	  try {
		const response = await fetch('https://aivs-coffee-backend.onrender.com/ask', {
		  method: 'POST',
		  headers: { 'Content-Type': 'application/json' },
		  body: JSON.stringify({ question, email })
		});
		const data = await response.json();
		pre.innerText = data.answer || '⚠️ No response.';
	  } catch (err) {
		pre.innerText = '❌ Error talking to the server.';
		console.error(err);
	  }
	};
  
	form.appendChild(textarea);
	form.appendChild(emailInput);
	form.appendChild(button);
  
	container.appendChild(form);
	container.appendChild(pre);
  })();