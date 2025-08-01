/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const selectedProductsList = document.getElementById("selectedProductsList");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");

/* Get reference to the generate routine button */
const generateRoutineBtn = document.getElementById("generateRoutine");

/* Array to store selected products */
let selectedProducts = [];

/* Load selected products from localStorage when page loads */
function loadSelectedProductsFromStorage() {
  try {
    const savedProducts = localStorage.getItem("selectedProducts");
    if (savedProducts) {
      selectedProducts = JSON.parse(savedProducts);
      console.log(
        "Loaded selected products from localStorage:",
        selectedProducts
      );
    }
  } catch (error) {
    console.error("Error loading selected products from localStorage:", error);
    selectedProducts = [];
  }
}

/* Save selected products to localStorage */
function saveSelectedProductsToStorage() {
  try {
    localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));
    console.log("Saved selected products to localStorage:", selectedProducts);
  } catch (error) {
    console.error("Error saving selected products to localStorage:", error);
  }
}

/* Load selected products when page loads */
loadSelectedProductsFromStorage();

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Update the selected products list in the UI */
function updateSelectedProductsDisplay() {
  /* Check if the selectedProductsList element exists */
  if (!selectedProductsList) {
    console.warn("selectedProductsList element not found");
    return;
  }

  console.log(
    "Updating display. Selected products count:",
    selectedProducts.length
  );

  if (selectedProducts.length === 0) {
    selectedProductsList.innerHTML =
      '<p class="no-products">No products selected</p>';
    console.log("Showing 'no products selected' message");
    return;
  }

  console.log("Creating HTML for selected products:", selectedProducts);

  selectedProductsList.innerHTML = selectedProducts
    .map(
      (product) => `
      <div class="selected-product-item">
        <img src="${product.image}" alt="${product.name}">
        <div class="selected-product-info">
          <h4>${product.name}</h4>
          <p>${product.brand}</p>
        </div>
        <button class="remove-product" data-product-id="${product.id}">
          <i class="fa-solid fa-times"></i>
        </button>
      </div>
    `
    )
    .join("");

  console.log("Selected products HTML updated");
  /* Add click listeners to remove buttons */
  addRemoveProductListeners();
}

/* Add click event listeners to remove buttons in selected products */
function addRemoveProductListeners() {
  const removeButtons = document.querySelectorAll(".remove-product");

  removeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const productId = button.dataset.productId;

      /* Remove from selected products array - convert to number for comparison */
      selectedProducts = selectedProducts.filter(
        (p) => p.id !== parseInt(productId)
      );

      /* Save updated selection to localStorage */
      saveSelectedProductsToStorage();

      /* Remove selected class from product card if visible */
      const productCard = document.querySelector(
        `[data-product-id="${productId}"]`
      );
      if (productCard) {
        productCard.classList.remove("selected");
      }

      /* Update the display */
      updateSelectedProductsDisplay();
    });
  });
}

/* Initialize the selected products display */
updateSelectedProductsDisplay();

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

/* Add click event listeners to product cards for selection */
function addProductClickListeners(products) {
  const productCards = document.querySelectorAll(".product-card");

  console.log("Found", productCards.length, "product cards");
  console.log("Products array:", products);

  productCards.forEach((card) => {
    card.addEventListener("click", () => {
      const productId = card.dataset.productId;
      console.log(
        "Card clicked. Product ID from HTML:",
        productId,
        "Type:",
        typeof productId
      );

      /* Convert productId to number since JSON has numeric IDs but HTML data attributes are strings */
      const product = products.find((p) => p.id === parseInt(productId));

      if (!product) {
        console.error("Product not found for ID:", productId);
        console.log(
          "Available products:",
          products.map((p) => ({ id: p.id, name: p.name }))
        );
        return;
      }

      console.log("Found product:", product);
      /* Toggle the selection state of this card */
      toggleProductSelection(card, product);
    });
  });
}

/* Toggle product selection state and update UI */
function toggleProductSelection(card, product) {
  /* Add debugging to see what's happening */
  console.log("Toggling product:", product);
  console.log("Product ID:", product?.id);
  console.log("Current selected products:", selectedProducts);

  const isSelected = card.classList.contains("selected");

  if (isSelected) {
    /* Remove from selection - compare IDs as numbers */
    card.classList.remove("selected");
    selectedProducts = selectedProducts.filter((p) => p.id !== product.id);
    console.log("Removed product. New count:", selectedProducts.length);
  } else {
    /* Add to selection */
    card.classList.add("selected");
    selectedProducts.push(product);
    console.log("Added product. New count:", selectedProducts.length);
  }

  /* Save updated selection to localStorage */
  saveSelectedProductsToStorage();

  /* Update the selected products display immediately */
  updateSelectedProductsDisplay();
}

/* Create HTML for displaying product cards */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map(
      (product) => `
    <div class="product-card" data-product-id="${product.id}">
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
      </div>
      <div class="selection-indicator">
        <i class="fa-solid fa-check"></i>
      </div>
      <div class="product-description-tooltip">
        <p>${product.description}</p>
      </div>
    </div>
  `
    )
    .join("");

  /* Add click event listeners to all product cards */
  addProductClickListeners(products);

  /* Add hover event listeners to show/hide descriptions */
  addProductHoverListeners();

  /* Restore selection state for previously selected products */
  restoreSelectionState();
}

/* Restore visual selection state for cards that are already selected */
function restoreSelectionState() {
  selectedProducts.forEach((selectedProduct) => {
    const productCard = document.querySelector(
      `[data-product-id="${selectedProduct.id}"]`
    );
    if (productCard) {
      productCard.classList.add("selected");
      console.log(`Restored selection for product ID: ${selectedProduct.id}`);
    }
  });
}

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;

  /* filter() creates a new array containing only products 
     where the category matches what the user selected */
  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory
  );

  displayProducts(filteredProducts);
});

/* Array to store conversation history */
let messages = [];

/* Cloudflare Worker URL for OpenAI API */
const workerUrl = "https://loreal-worker.nguyen-c9.workers.dev/";

/* Function to send message to OpenAI API with web search */
async function sendMessageWithWebSearch(
  userMessage,
  isRoutineGeneration = false
) {
  /* Prepare the API request with web search enabled */
  const requestBody = {
    model: "gpt-4.1",
    messages: isRoutineGeneration
      ? [
          {
            role: "system",
            content:
              "You are an expert beauty and skincare advisor specializing in L'Oréal products. Use web search to find the latest information about beauty trends, product reviews, and skincare advice. Create detailed, personalized routines based on current best practices.",
          },
          {
            role: "user",
            content: userMessage,
          },
        ]
      : messages,
    max_tokens: 800,
    temperature: 0.7,
    /* Enable web search for more current information */
    tools: [
      {
        type: "web_search",
      },
    ],
    tool_choice: "auto",
  };

  const response = await fetch(workerUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  return response;
}

/* Function to convert markdown-like formatting to HTML */
function convertMarkdownToHtml(text) {
  /* Convert **bold** to <strong> */
  text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  /* Convert *italic* to <em> */
  text = text.replace(/\*(.*?)\*/g, "<em>$1</em>");

  /* Convert # headers to <h3> */
  text = text.replace(/^### (.*$)/gm, "<h3>$1</h3>");
  text = text.replace(/^## (.*$)/gm, "<h3>$1</h3>");
  text = text.replace(/^# (.*$)/gm, "<h3>$1</h3>");

  /* Convert bullet points - ... to <li> */
  text = text.replace(/^- (.*$)/gm, "<li>$1</li>");

  /* Wrap consecutive <li> elements in <ul> */
  text = text.replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>");

  /* Convert numbered lists 1. ... to <ol><li> */
  text = text.replace(/^\d+\. (.*$)/gm, "<li>$1</li>");

  /* Convert line breaks */
  text = text.replace(/\n/g, "<br>");

  return text;
}

/* Function to make URLs clickable */
function makeLinksClickable(text) {
  /* Regular expression to find URLs */
  const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/g;

  /* Replace URLs with clickable links that open in new tab */
  return text.replace(
    urlRegex,
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
  );
}

/* Function to process AI response text */
function processAiResponse(text) {
  /* First convert markdown to HTML */
  let processedText = convertMarkdownToHtml(text);

  /* Then make links clickable */
  processedText = makeLinksClickable(processedText);

  return processedText;
}

/* Chat form submission handler - Cloudflare Worker integration */
chatForm.addEventListener("submit", async (event) => {
  event.preventDefault(); // Prevent the form from submitting the traditional way

  /* Get the user's message from the input field */
  const userInput = document.getElementById("userInput");
  const userMessage = userInput.value.trim();

  /* Don't send empty messages */
  if (!userMessage) {
    return;
  }

  /* Show loading message in chat window */
  chatWindow.innerHTML = `
    <div class="message user-message">
      <strong>You:</strong> ${userMessage}
    </div>
    <div class="message ai-message">
      <strong>AI Assistant:</strong> <em>Searching the web and thinking...</em>
    </div>
  `;

  /* Clear the input field */
  userInput.value = "";

  /* Build context with selected products for web search */
  if (messages.length === 0) {
    let productContext = "";
    if (selectedProducts.length > 0) {
      productContext = `\n\nThe user has selected these L'Oréal products: ${selectedProducts
        .map((p) => `${p.name} by ${p.brand}`)
        .join(
          ", "
        )}. Please search for current information about these products and beauty routines.`;
    }

    messages.push({
      role: "system",
      content: `You are a helpful beauty and skincare assistant for L'Oréal products. 
      Use web search to find the latest beauty trends, product information, and skincare advice.
      Help users create personalized beauty routines based on current best practices and their selected products.
      Be friendly, knowledgeable, and provide up-to-date practical advice.${productContext}`,
    });
  }

  messages.push({ role: "user", content: userMessage });

  try {
    /* Use web search enabled function */
    const response = await sendMessageWithWebSearch(userMessage);

    if (!response.ok) {
      throw new Error(
        `Worker request failed: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    messages.push({ role: "assistant", content: aiResponse });
    updateChatDisplay(userMessage, aiResponse);
  } catch (error) {
    console.error("Error calling Cloudflare Worker:", error);
    chatWindow.innerHTML = `
      <div class="message user-message">
        <strong>You:</strong> ${userMessage}
      </div>
      <div class="message error-message">
        <strong>Error:</strong> Sorry, I'm having trouble connecting right now. Please try again later.
      </div>
    `;
  }
});

/* Generate Routine button click handler */
generateRoutineBtn.addEventListener("click", async () => {
  /* Check if user has selected any products */
  if (selectedProducts.length === 0) {
    chatWindow.innerHTML = `
      <div class="message error-message">
        <strong>No Products Selected:</strong> Please select some products first to generate a routine.
      </div>
    `;
    return;
  }

  /* Show loading message in chat window */
  chatWindow.innerHTML = `
    <div class="message ai-message">
      <strong>AI Routine Generator:</strong> <em>Searching for latest beauty trends and creating your routine...</em>
    </div>
  `;

  /* Prepare detailed product information for the AI */
  const productDetails = selectedProducts.map((product) => {
    return {
      name: product.name,
      brand: product.brand,
      category: product.category,
      description: product.description,
    };
  });

  /* Enhanced prompt with web search request */
  const routinePrompt = `Please search the web for the latest beauty trends and skincare advice, then create a detailed, personalized beauty routine using these specific L'Oréal products:

${productDetails
  .map(
    (product) =>
      `• ${product.name} by ${product.brand} (${product.category})
    Description: ${product.description}`
  )
  .join("\n\n")}

Please search for:
- Current reviews and recommendations for these specific products
- Latest beauty trends and techniques for 2024
- Best practices for using these types of products together
- Any recent dermatologist recommendations

Then provide:
1. A step-by-step routine organized by time of day (morning/evening)
2. The correct order to use these products based on current best practices
3. Latest tips for application and usage
4. How these products work together according to current research

Make the routine practical, up-to-date, and easy to follow. Include any recent trends or techniques that would enhance the effectiveness of these L'Oréal products.`;

  try {
    /* Use web search for routine generation */
    const response = await sendMessageWithWebSearch(routinePrompt, true);

    if (!response.ok) {
      throw new Error(
        `Worker request failed: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    const routineResponse = data.choices[0].message.content;

    /* Process the routine response to convert markdown and make links clickable */
    const processedRoutineResponse = processAiResponse(routineResponse);

    chatWindow.innerHTML = `
      <div class="message ai-message routine-message">
        <strong>Your Personalized L'Oréal Routine (with latest trends):</strong>
        <div class="routine-content">
          ${processedRoutineResponse}
        </div>
      </div>
    `;

    messages = [{ role: "assistant", content: routineResponse }];
  } catch (error) {
    console.error("Error generating routine:", error);
    chatWindow.innerHTML = `
      <div class="message error-message">
        <strong>Error:</strong> Sorry, I couldn't generate your routine right now. Please try again later.
      </div>
    `;
  }
});

/* Function to update the chat display with messages */
function updateChatDisplay(userMessage, aiResponse) {
  /* Process the AI response to convert markdown and make links clickable */
  const processedAiResponse = processAiResponse(aiResponse);

  chatWindow.innerHTML = `
    <div class="message user-message">
      <strong>You:</strong> ${userMessage}
    </div>
    <div class="message ai-message">
      <strong>AI Assistant:</strong> ${processedAiResponse}
    </div>
  `;
}

/* Store the user message for display */
userInput.dataset.lastMessage = userMessage;
userInput.dataset.lastMessage = userMessage;
