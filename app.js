// BUDGET CONTROLLER
var budgetController = (function () {
  // Data structure to insert expenses and incomes
  var Expense = function (id, description, value) {
    this.id = id;
    this.description = description;
    this.value = value;
    this.percentage = -1;
  };

  var Income = function (id, description, value) {
    this.id = id;
    this.description = description;
    this.value = value;
  };

  Expense.prototype.calcPercentage = function (totalIncome) {
    if (totalIncome > 0) {
      this.percentage = Math.round((this.value / totalIncome) * 100);
    } else {
      this.percentage = -1;
    }
  };

  Expense.prototype.getPercentage = function () {
    return this.percentage;
  };

  // Data structure to save all info inputed
  var data = {
    allItems: {
      expense: [],
      income: [],
    },
    totals: {
      expense: 0,
      income: 0,
    },
    budget: 0,
    percentage: -1,
  };

  var calculateTotals = function (type) {
    var sum = 0;

    data.allItems[type].forEach(function (current) {
      sum += current.value;
    });

    data.totals[type] = sum;
  };

  return {
    // Public method to add item to our data structure
    addItem: function (type, description, value) {
      var ID, newItem;

      // Create a new ID
      if (data.allItems[type].length > 0) {
        ID = data.allItems[type][data.allItems[type].length - 1].id + 1;
      } else {
        ID = 0;
      }

      // Create new item based on type
      if (type === "expense") {
        newItem = new Expense(ID, description, value);
      } else if (type === "income") {
        newItem = new Income(ID, description, value);
      }

      // Push newly created item to the data structure
      data.allItems[type].push(newItem);

      // return new item to other controllers to access it
      return newItem;
    },

    deleteItem: function (type, id) {
      var ids, index;

      ids = data.allItems[type].map(function (cur) {
        return cur.id;
      });

      index = ids.indexOf(id);

      data.allItems[type].splice(index, 1);
    },

    calculateBudget: function () {
      // 1. Calculate the total incomes and expenses
      calculateTotals("income");
      calculateTotals("expense");

      // 2. Calculate the budget
      data.budget = data.totals.income - data.totals.expense;

      // 3. Calculate the percentage of income that we spent
      if (data.totals.income > 0) {
        data.percentage = Math.round(
          (data.totals.expense / data.totals.income) * 100
        );
      } else {
        data.percentage = -1;
      }
    },

    calculatePercentages: function () {
      data.allItems.expense.forEach(function (current) {
        return current.calcPercentage(data.totals.income);
      });
    },

    getPercentages: function () {
      var allPerc;
      allPerc = data.allItems.expense.map(function (current) {
        return current.percentage;
      });

      return allPerc;
    },

    getBudget: function () {
      return {
        budget: data.budget,
        totalInc: data.totals.income,
        totalExp: data.totals.expense,
        percentage: data.percentage,
      };
    },

    // --- Local Storage stuff ---
    storeData: function () {
      localStorage.setItem("data", JSON.stringify(data));
    },

    deleteData: function () {
      localStorage.removeItem("data");
    },

    getStoredData: function () {
      localData = JSON.parse(localStorage.getItem("data"));
      return localData;
    },

    updateData: function (StoredData) {
      data.totals = StoredData.totals;
      data.budget = StoredData.budget;
      data.percentage = StoredData.percentage;
    },

    testing: function () {
      console.log(data);
    },
  };
})();

// UI CONTROLLER
var UIController = (function () {
  var DOMStrings = {
    inputType: "#checkbox",
    inputDescription: ".add__description",
    inputValue: ".add__value",
    inputBtn: ".input__btn",
    container: ".panel",
    budgetLabel: ".summary__budget",
    incomeLabel: ".income__value",
    expenseLabel: ".expenses__value",
    percentageLabel: ".expenses__percentage",
    dateLabel: ".summary__month",
    dark: ".dark-toggle",
  };

  // Accepts a number and a type, and changes a sign -/+ accordingly
  // Puts , on thousands
  var formatNumber = function (num, type) {
    var numSplit, int, dec, type;
    // Example to format a number => 1000 -> + 1,000.00 -> + 10, 000.00 -> + 100, 000.00

    num = Math.abs(num);
    num = num.toFixed(2);
    numSplit = num.split(".");

    int = numSplit[0];

    if (int.length > 3) {
      int = int.substr(0, int.length - 3) + "," + int.substr(int.length - 3, 3);
    }

    dec = numSplit[1];

    return (type === "expense" ? "-" : "+") + " " + int + "." + dec;
  };

  return {
    getInput: function () {
      return {
        type: document.querySelector(DOMStrings.inputType).checked
          ? "expense"
          : "income",
        description: document.querySelector(DOMStrings.inputDescription).value,
        value: parseFloat(document.querySelector(DOMStrings.inputValue).value),
      };
    },

    addListItem: function (type, obj) {
      var html, newHtml, element;

      // Create HTML strings with placeholder text
      if (type === "expense") {
        element = DOMStrings.container;
        html =
          '<div class="panel__item panel__item-expense" id="expense-%id%"><div class="panel__item__details"><div class="panel__item__details-name">%desc%</div></div><div class="panel__item__value"><div class="panel__item__value-number">%value%</div><div class="panel__item__value-percentage">83%</div></div><button class="item__delete--btn"><svg class="icon icon-cross"><use xlink:href="#icon-cross"></use></svg></button></div>';
      } else if ((type = "income")) {
        element = DOMStrings.container;
        html =
          '<div class="panel__item panel__item-income" id="income-%id%"><div class="panel__item__details"><div class="panel__item__details-name">%desc%</div></div><div class="panel__item__value"><div class="panel__item__value-number">%value%</div></div><button class="item__delete--btn"><svg class="icon icon-cross"><use xlink:href="#icon-cross"></use></svg></button></div>';
      }

      // Replace placeholder text with data
      newHtml = html.replace("%id%", obj.id);
      newHtml = newHtml.replace("%desc%", obj.description);
      newHtml = newHtml.replace("%value%", formatNumber(obj.value, type));

      // Insert the HTML into the DOM
      document.querySelector(element).insertAdjacentHTML("afterbegin", newHtml);
    },

    // Clear input fields
    clearFields: function () {
      var fields;

      fields = document.querySelectorAll(
        DOMStrings.inputDescription + "," + DOMStrings.inputValue
      );
      fieldsArr = Array.prototype.slice.call(fields);

      fieldsArr.forEach(function (current) {
        current.value = "";
      });

      fieldsArr[0].focus();
    },

    // Display Budget
    displayBudget: function (obj) {
      var type;
      obj.budget > 0 ? (type = "income") : (type = "expense");
      document.querySelector(DOMStrings.budgetLabel).textContent = formatNumber(
        obj.budget,
        type
      );
      document.querySelector(DOMStrings.incomeLabel).textContent = formatNumber(
        obj.totalInc,
        "income"
      );
      document.querySelector(
        DOMStrings.expenseLabel
      ).textContent = formatNumber(obj.totalExp, "expense");

      if (obj.percentage > 0) {
        document.querySelector(DOMStrings.percentageLabel).textContent =
          obj.percentage + "%";
      } else {
        document.querySelector(DOMStrings.percentageLabel).textContent = "---";
      }
    },

    // Display percentages
    displayPercentages: function (percentages) {
      var fields = document.querySelectorAll(".panel__item__value-percentage");

      var nodeListForEach = function (list, callback) {
        for (var i = 0; i < list.length; i++) {
          callback(list[i], i);
        }
      };

      nodeListForEach(fields, function (current, index) {
        if (percentages[index] > 0) {
          current.textContent = percentages[index] + "%";
        } else {
          current.textContent = "---";
        }
      });
    },

    // Delete List Item
    deleteListItem: function (selectorID) {
      var el = document.getElementById(selectorID);
      el.parentNode.removeChild(el);
    },

    // Show Date
    showDate: function () {
      var now;
      now = new Date();

      month = now.getMonth();
      year = now.getFullYear();

      var months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];

      document.querySelector(DOMStrings.dateLabel).textContent =
        months[month] + " " + year;
    },

    changedType: function () {
      var fields;

      fields = document.querySelectorAll(
        DOMStrings.inputDescription + "," + DOMStrings.inputValue
      );

      Array.prototype.forEach.call(fields, function (current) {
        current.classList.toggle("red");
        current.classList.toggle("red-border");
      });

      document.querySelector(DOMStrings.inputBtn).classList.toggle("red");
    },

    darkMode: function () {
      document.querySelector("body").classList.toggle("dark");
      document.querySelector(".dark-toggle").styl;
    },

    getDOMStrings: function () {
      return DOMStrings;
    },
  };
})();

// APP CONTROLLER
var controller = (function (budgetCtrl, UICtrl) {
  // Event Listeners
  var setupEventListeners = function () {
    var DOM = UICtrl.getDOMStrings();

    document.querySelector(DOM.inputBtn).addEventListener("click", ctrlAddItem);
    document.addEventListener("keypress", function (e) {
      if (e.keyCode === 13 && e.which === 13) {
        ctrlAddItem();
      }
    });

    document
      .querySelector(DOM.container)
      .addEventListener("click", ctrlDeleteItem);
    document
      .querySelector(DOM.inputType)
      .addEventListener("change", UICtrl.changedType);
    document.querySelector(DOM.dark).addEventListener("click", UICtrl.darkMode);
    document.addEventListener("DOMContentLoaded", function () {
      document.querySelector(DOM.inputDescription).focus();
    });
  };

  var loadData = function () {
    var storedData, newIncItem, newExpItem, budget;

    // 1. load the data from the local storage
    storedData = budgetCtrl.getStoredData();

    if (storedData) {
      // 2. insert the data into the data structure
      budgetCtrl.updateData(storedData);

      // 3. Create the Income Object
      storedData.allItems.income.forEach(function (cur) {
        newIncItem = budgetCtrl.addItem("income", cur.description, cur.value);
        UICtrl.addListItem("income", newIncItem);
      });

      // 4. Create the Expense Objects
      storedData.allItems.expense.forEach(function (cur) {
        newExpItem = budgetCtrl.addItem("expense", cur.description, cur.value);
        UICtrl.addListItem("expense", newExpItem);
      });

      // 5. Display the Budget
      budget = budgetCtrl.getBudget();
      UICtrl.displayBudget(budget);

      // 6. Display the Percentages
      updatePercentages();
    }
  };

  var updateBudget = function () {
    var budget;

    // 1. Calculate the budget
    budgetCtrl.calculateBudget();
    // 2. Return the budget
    budget = budgetCtrl.getBudget();
    // 3. Display the budget on the UI
    UICtrl.displayBudget(budget);
  };

  var updatePercentages = function () {
    var percentages;

    // 1. Calculate percentages
    budgetCtrl.calculatePercentages();
    // 2. Read percentages from the data structure
    percentages = budgetCtrl.getPercentages();
    // 3. Display percentages on the UI
    UICtrl.displayPercentages(percentages);
  };

  var ctrlAddItem = function () {
    // 1. Get the input field data
    var input, newItem;

    input = UICtrl.getInput();

    if (input.description !== "" && input.value > 0 && !isNaN(input.value)) {
      // 2. Add the item to the budget controller
      var newItem = budgetCtrl.addItem(
        input.type,
        input.description,
        input.value
      );

      // 3. Add the item to the UI
      UICtrl.addListItem(input.type, newItem);
      // 4. Clear input fields
      UICtrl.clearFields();
      // 5. Calculate and update budget
      updateBudget();
      // 6. Calculate and update percentages
      updatePercentages();
      // 7. Save to local storage
      budgetCtrl.storeData();
    }
  };

  var ctrlDeleteItem = function (event) {
    var itemID, splitID, type, ID;
    itemID = event.target.parentNode.parentNode.parentNode.id;
    if (itemID) {
      splitID = itemID.split("-");
      type = splitID[0];
      ID = parseInt(splitID[1]);

      // 1. Delete the item from data structure
      budgetCtrl.deleteItem(type, ID);

      // 2. Delete the item from UI
      UICtrl.deleteListItem(itemID);

      // 3. Update and show new budget
      updateBudget();

      // 4. Calculate and update the percentages
      updatePercentages();

      // 5. save to local storage
      budgetCtrl.storeData();
    }
  };

  return {
    init: function () {
      console.log("Application has started!");
      UICtrl.showDate();
      UICtrl.displayBudget({
        budget: 0,
        totalInc: 0,
        totalExp: 0,
        percentage: 0,
      });
      setupEventListeners();
      loadData();
    },
  };
})(budgetController, UIController);

controller.init();
