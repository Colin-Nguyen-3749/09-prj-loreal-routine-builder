/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const selectedProductsList = document.getElementById("selectedProductsList");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");

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

/* Chat form submission handler - placeholder for OpenAI integration */
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  chatWindow.innerHTML = "Connect to the OpenAI API for a response!";
});
  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory
  );
  displayProducts(filteredProducts);

/* Chat form submission handler - placeholder for OpenAI integration */
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  chatWindow.innerHTML = "Connect to the OpenAI API for a response!";
});
