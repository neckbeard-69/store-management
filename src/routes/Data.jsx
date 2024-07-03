import React, { useEffect, useState } from "react";
import axios from "axios";
import { HandleNumericInput } from "./Form";
const SERVER_URL = "http://localhost:8000";
export default function Data() {
    const [collections, setCollections] = useState([]);
    const [data, setData] = useState([]);
    const [selectedCollection, setSelectedCollection] = useState("");
    async function toggleIsDone(index) {
        if (!window.confirm("Are you sure you want to change the state?"))
            return;
        if (index < 0 || index >= data.length) {
            console.error("Invalid index:", index);
            return;
        }

        const item = data[index];
        if (!item) {
            console.error("Item not found at index:", index);
            return;
        }

        const collectionName = item["collection-name"];
        const orderId = item["_id"];
        const orderNum = item["order-num"];

        try {
            const response = await axios.post(
                `${SERVER_URL}/is-done/${orderId}?order-num=${orderNum}&collection-name=${collectionName}`,
            );
            if (response.status === 200) {
                alert("Order state changed successfully!");
                const newData = [...data];
                newData[index] = {
                    ...newData[index],
                    "is-done": !newData[index]["is-done"],
                };
                setData(newData);
                window.location.reload();
            } else {
                throw new Error("Failed to toggle the state");
            }
        } catch (error) {
            console.error("Failed to update order state:", error);
            alert("There was an error changing the order state");
        }
    }
    const handleDelete = async (itemId) => {
        if (!confirm("Are you sure you want to DELETE an order?")) return;
        const collectionName = selectedCollection;
        try {
            const response = await axios.delete(
                `${SERVER_URL}/deleteDocument/${collectionName}/${itemId}`,
            );
            if (!response.status === 200) {
                throw new Error(
                    response.data?.message || "Failed to delete the document.",
                );
            }
            const data = response.data || {
                message: "Document deleted successfully",
            };
            setData((prevData) =>
                prevData.filter((item) => item._id !== itemId),
            );
            alert(data.message);
        } catch (error) {
            console.error("Error deleting document:", error);
            alert(error.response?.data?.message || error.message);
        }
    };
    const calculateAndSetPercentage = (index) => {
        const inputField = document.getElementById(`percentage-input-${index}`);
        if (!inputField) {
            console.error("Input field not found");
            return;
        }

        const totalProfit = data[index]["total-profit"];
        if (!totalProfit) {
            console.error(
                "Invalid item or total-profit not found:",
                data[index],
            );
            return;
        }

        const userPercentage = parseFloat(inputField.value);
        if (isNaN(userPercentage)) {
            console.error("Invalid percentage input:", inputField.value);
            return;
        }

        const calculatedPercentage = (userPercentage / 100) * totalProfit;
        inputField.value = calculatedPercentage.toString();
    };
    useEffect(() => {
        const fetchCollections = async () => {
            try {
                const response = await axios.get(`${SERVER_URL}/collections`);
                setCollections(response.data);
                setCollections((prev) =>
                    prev.filter(
                        (collection) =>
                            collection !== "months-profits" &&
                            collection !== "storage",
                    ),
                );
            } catch (error) {
                console.error("Failed to fetch collections:", error);
            }
        };

        fetchCollections();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(
                    `${SERVER_URL}/get/${selectedCollection}`,
                );
                setData(response.data);
            } catch (error) {
                console.error("Failed to fetch data:", error);
            }
        };

        if (selectedCollection) {
            fetchData();
        }
    }, [selectedCollection]);
    useEffect(() => {
        if (collections.length > 0) {
            setSelectedCollection(collections[0]);
        }
    }, [collections]);

    const handleChange = (event) => {
        setSelectedCollection(event.target.value);
    };

    const updateOrderState = async (index) => {
        if (!window.confirm("Are you sure you want to change the state?"))
            return;
        if (index < 0 || index >= data.length) {
            console.error("Invalid index:", index);
            return;
        }

        const newData = [...data];
        const item = newData[index];
        const newState = document.getElementById(`state-select-${index}`).value;
        const collectionName = item["collection-name"];
        const oldState = item["order-state"];
        setData(newData);
        try {
            await axios.post(
                `${SERVER_URL}/updateState/?orderId=${item._id}&newState=${newState}&collectionName=${collectionName}`,
            );
            console.log("New state:", newState);
            await axios.post(
                `${SERVER_URL}/profit/?month=${item["collection-name"]}&state=${newState}&cost=${item["total-cost"]}&profit=${item["total-profit"]}&pieces=${item["pieces-num"]}&oldState=${oldState}`,
            );
            alert("Order state changed successfully");
        } catch (err) {
            console.error("Failed to update order state:", err);
            alert(err.response.data);
        }
    };

    return (
        <div className="data-page">
            <label htmlFor="month">Select a month: </label>
            <select
                id="month"
                value={selectedCollection}
                onChange={handleChange}
            >
                {collections.map((collection) => (
                    <option key={collection} value={collection}>
                        {collection}
                    </option>
                ))}
            </select>
            {selectedCollection && (
                <div>
                    <h2>{selectedCollection}</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Order Number</th>
                                <th>Order State</th>
                                <th>Customer Name</th>
                                <th>Customer City</th>
                                <th>Customer Phone</th>
                                <th>Seller Name</th>
                                <th>Total Cost</th>
                                <th>Seller Profit</th>
                                <th>Delivery Fee</th>
                                <th>Cost of Product</th>
                                <th>Number of pieces</th>
                                <th>Size</th>
                                <th>Color</th>
                                <th>Clothes Type</th>
                                <th>Total profit</th>
                                <th>Profit percentage</th>
                                <th>Is done</th>
                                <th>Delete</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data?.map((item, index) => (
                                <tr key={index}>
                                    <td>{item["order-num"]}</td>
                                    <td>
                                        <select
                                            id={`state-select-${index}`}
                                            defaultValue={item["order-state"]}
                                        >
                                            <option value="pending">
                                                Pending
                                            </option>
                                            <option value="delivered">
                                                Delivered
                                            </option>
                                            <option value="returned">
                                                Returned
                                            </option>
                                        </select>
                                        <button
                                            onClick={() =>
                                                updateOrderState(
                                                    index,
                                                    item._id,
                                                )
                                            }
                                        >
                                            Update State
                                        </button>
                                    </td>
                                    <td>{item["customer-name"]}</td>
                                    <td>{item["customer-city"]}</td>
                                    <td>{item["customer-phone"]}</td>
                                    <td>{item["seller-name"]}</td>
                                    <td>{item["total-cost"]}</td>
                                    <td>{item["seller-profit"]}</td>
                                    <td>{item["delivery-fee"]}</td>
                                    <td>{item["cost-of-product"]}</td>
                                    <td>{item["pieces-num"]}</td>
                                    <td>{item.size}</td>
                                    <td>{item.color}</td>
                                    <td>{item["clothes-type"]}</td>
                                    <td>{item["total-profit"]}</td>
                                    <td>
                                        <input
                                            type="text"
                                            id={`percentage-input-${index}`}
                                            placeholder="Enter percentage"
                                            onChange={(e) =>
                                                HandleNumericInput(e, 3, 0, 100)
                                            }
                                        />
                                        <button
                                            onClick={() =>
                                                calculateAndSetPercentage(index)
                                            }
                                        >
                                            Calculate
                                        </button>
                                    </td>
                                    <td
                                        style={{
                                            backgroundColor: !item["is-done"]
                                                ? "#f7a59c"
                                                : "#9cf7a2",
                                        }}
                                    >
                                        {item["is-done"] ? "Yes" : "No"}

                                        <button
                                            onClick={() => toggleIsDone(index)}
                                        >
                                            Toggle
                                        </button>
                                    </td>
                                    <td>
                                        <button
                                            className="delete-btn"
                                            onClick={() =>
                                                handleDelete(item._id)
                                            }
                                            style={{ background: "#ff6054" }}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
