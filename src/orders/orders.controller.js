const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
function orderExists(req, res, next){
    const { orderId } = req.params;
    const foundOrder = orders.find((order) => order.id === orderId);
    if(foundOrder) {
        res.locals.order = foundOrder;
        return next();
    } else {
        return next({
            status: 404,
            message: `Order id not found: ${orderId}`
        });
    };
};


function orderIsPending(req, res, next) {
    const { orderId } = req.params;
    const foundOrder = orders.find((order) => order.id === orderId);
    if(foundOrder && foundOrder.status === 'pending') {
        res.locals.order = foundOrder;
        return next();
    } else {
        return next({
            status: 400,
            message: "Order must be pending to be deleted."
        });
    };
};


function hasValidAddress(req, res, next) {
    const { data: { deliverTo } = {} } = req.body;
    if (deliverTo) {
        return next();
    } else {
        return next({
            status: 400,
            message: "A 'deliverTo' property is required."
        });
    };
};


function hasValidMobileNumber(req, res, next) {
    const { data: { mobileNumber } = {} } = req.body;
    if (mobileNumber) {
        return next();
    } else {
        return next({
            status: 400,
            message: "A 'mobileNumber' is required."
        });
    };
}; 


function hasValidDishes (req, res, next) {
    const { data: { dishes } = {} } = req.body;
     
    if (!dishes || dishes.length === 0 || !Array.isArray(dishes)) {
        return next({
        status: 400,
        message: "Order must include at least one dish."
        });
    } else {
        return next();
    };
};


function hasValidDishQuantity(req, res, next){
    const { data: { dishes } = {} } = req.body;
    dishes.forEach((dish, index) => {
        const quantity = dish.quantity;
        if(!quantity || quantity <= 0 || typeof quantity !== 'number') {
            return next({
                status: 400,
                message: `Dish ${index} must have a quantity that is an integer greater than 0`
            });
        };
    });
    return next();
};



function validStatusToUpdate(req, res, next) {
    const { data: { status } = {} } = req.body;
    if (status === 'pending' || status === 'out-for-delivery' || status === 
'preparing') {
        return next();
    } else {
        return next({
            status: 400,
            message: `Order status must be pending. This order is ${status}.`
        });
    };
};


function orderIdMatchesData(req, res, next) {
    const { orderId } = req.params;
    const { data: { id } = {} } = req.body;
    if (id === orderId || !id) {
        return next();
    } else {
        return next({
            status: 400,
            message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`
        });
    };
};



function list(req, res) {
    res.json({ data: orders });
};


function read(req, res) {
    const order = res.locals.order;
    res.json({ data: order });
};


function create(req, res) {
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } =  req.body;
    const id = nextId();
    const newOrder = {
        id,
        deliverTo,
        mobileNumber,
        status,
        dishes
    };
    orders.push(newOrder);
    res.status(201).json({ data: newOrder});
};


function update(req, res) {
    let order = res.locals.order;
    const { data }  = req.body;
    if (order.id) { data.id = order.id};
         order = {
            id: data.id,
            deliverTo: data.deliverTo,
            mobileNumber: data.mobileNumber,
            status: data.status,
            dishes: data.dishes
        };
    res.json({ data: order });
};


function destroy(req, res) {
    const orderToDelete = res.locals.order;
    const index = orders.find((order) => order.id === orderToDelete.id);
        orders.splice(index, 1);
        res.sendStatus(204);
};


module.exports = {
    list,
    read: [
        orderExists, 
        read],
    create: [
        hasValidAddress, 
        hasValidMobileNumber, 
        hasValidDishes, 
        hasValidDishQuantity, 
        create],
    update: [
        orderExists, 
        orderIdMatchesData, 
        validStatusToUpdate, 
        hasValidAddress, 
        hasValidMobileNumber, 
        hasValidDishes, 
        hasValidDishQuantity, 
        update],
    delete: [
        orderExists, 
        orderIsPending, 
        destroy]
};