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
}

/* Add hover event listeners to product cards for description tooltips */
function addProductHoverListeners() {
  const productCards = document.querySelectorAll(".product-card");

  productCards.forEach((card) => {
    /* CSS handles the hover effect, but we can add additional logic here if needed */
    /* The tooltip will show/hide automatically with CSS :hover pseudo-class */
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
      <strong>AI Assistant:</strong> <em>Thinking...</em>
    </div>
  `;

  /* Clear the input field */
  userInput.value = "";

  /* Create system message if this is the first message */
  if (messages.length === 0) {
    /* Build context about selected products */
    let productContext = "";
    if (selectedProducts.length > 0) {
      productContext = `\n\nThe user has selected these products: ${selectedProducts
        .map((p) => `${p.name} by ${p.brand}`)
        .join(", ")}`;
    }

    /* Add system message to help AI understand its role */
    messages.push({
      role: "system",
      content: `You are a helpful beauty and skincare assistant for L'Oréal products. 
      Help users create personalized beauty routines based on their selected products and needs. 
      Be friendly, knowledgeable, and provide practical advice about skincare, makeup, and haircare.
      Keep responses concise and helpful.${productContext}`,
    });
  }

  /* Add the user's message to the conversation history */
  messages.push({ role: "user", content: userMessage });

  try {
    /* Send a POST request to your Cloudflare Worker */
    const response = await fetch(workerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: messages,
      }),
    });

    /* Check if the response is successful */
    if (!response.ok) {
      throw new Error(
        `Worker request failed: ${response.status} ${response.statusText}`
      );
    }

    /* Parse the JSON response from the worker */
    const data = await response.json();

    /* Get the AI's response from the worker data */
    const aiResponse = data.choices[0].message.content;

    /* Add AI response to conversation history */
    messages.push({ role: "assistant", content: aiResponse });

    /* Update the chat window with both messages */
    updateChatDisplay(userMessage, aiResponse);
  } catch (error) {
    /* Show error message if worker call fails */
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
      <strong>AI Routine Generator:</strong> <em>Creating your personalized routine...</em>
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

  /* Create a comprehensive prompt for routine generation */
  const routinePrompt = `Please create a detailed, personalized beauty routine using these specific products I've selected:

${productDetails
  .map(
    (product) =>
      `• ${product.name} by ${product.brand} (${product.category})
    Description: ${product.description}`
  )
  .join("\n\n")}

Please provide:
1. A step-by-step routine organized by time of day (morning/evening)
2. The correct order to use these products
3. Any important tips for application or usage
4. How these products work together

Make the routine practical and easy to follow for someone who wants to get the best results from these specific L'Oréal products. Dive right into the details, and remember to chunk the information into clear, actionable steps so that the reader doesn't get overwhelmed with info.`;

  /* Reset conversation history for routine generation */
  const routineMessages = [
    {
      role: "system",
      content:
        "You are an expert beauty and skincare advisor specializing in L'Oréal products. Create detailed, personalized routines based on the specific products users have selected. Be thorough, practical, and educational in your recommendations.",
    },
    {
      role: "user",
      content: routinePrompt,
    },
  ];

  try {
    /* Send request to Cloudflare Worker with product details */
    const response = await fetch(workerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: routineMessages,
      }),
    });

    /* Check if the response is successful */
    if (!response.ok) {
      throw new Error(
        `Worker request failed: ${response.status} ${response.statusText}`
      );
    }

    /* Parse the JSON response from the worker */
    const data = await response.json();

    /* Get the AI's routine response */
    const routineResponse = data.choices[0].message.content;

    /* Display the generated routine in the chat window */
    chatWindow.innerHTML = `
      <div class="message ai-message routine-message">
        <strong>Your Personalized L'Oréal Routine:</strong>
        <div class="routine-content">
          ${routineResponse.replace(/\n/g, "<br>")}
        </div>
      </div>
    `;

    /* Add the routine to conversation history for follow-up questions */
    messages = [
      ...routineMessages,
      { role: "assistant", content: routineResponse },
    ];
  } catch (error) {
    /* Show error message if routine generation fails */
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
  chatWindow.innerHTML = `
    <div class="message user-message">
      <strong>You:</strong> ${userMessage}
    </div>
    <div class="message ai-message">
      <strong>AI Assistant:</strong> ${aiResponse}
    </div>
  `;
}

/* Store the user message for display */
userInput.dataset.lastMessage = userMessage;
