import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api/v1';

export default function Dashboard({ token }) {
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(5);
    const [sort, setSort] = useState({ field: 'title', order: 'asc' });

    useEffect(() => {
        fetchProducts();
    }, [search, sort]);

    const fetchProducts = async () => {
        try {
            const res = await axios.get(`${API_URL}/products?title=${search}`);
            let data = res.data;
            
            // Sorting
            data.sort((a, b) => {
                if (a[sort.field] < b[sort.field]) return sort.order === 'asc' ? -1 : 1;
                if (a[sort.field] > b[sort.field]) return sort.order === 'asc' ? 1 : -1;
                return 0;
            });
            
            setProducts(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSort = (field) => {
        setSort({
            field,
            order: sort.field === field && sort.order === 'asc' ? 'desc' : 'asc'
        });
    };

    const exportCSV = () => {
        const csvRows = [];
        const headers = ['ID', 'Title', 'Price', 'Description'];
        csvRows.push(headers.join(','));

        products.forEach(p => {
            const values = [p._id, `"${p.title}"`, p.price, `"${p.description}"`];
            csvRows.push(values.join(','));
        });

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('href', url);
        a.setAttribute('download', 'products.csv');
        a.click();
    };

    // Pagination Logic
    const startIndex = (page - 1) * limit;
    const paginatedProducts = products.slice(startIndex, startIndex + limit);

    return (
        <div className="container mt-4">
            <h2>Product Dashboard</h2>
            
            <div className="d-flex justify-content-between mb-3">
                <input 
                    type="text" 
                    className="form-control w-25" 
                    placeholder="Search title..." 
                    onChange={(e) => setSearch(e.target.value)} 
                />
                <button className="btn btn-success" onClick={exportCSV}>Export CSV</button>
            </div>

            <table className="table table-bordered table-hover">
                <thead className="table-dark">
                    <tr>
                        <th>ID</th>
                        <th onClick={() => handleSort('title')} style={{cursor: 'pointer'}}>Title ↕</th>
                        <th onClick={() => handleSort('price')} style={{cursor: 'pointer'}}>Price ↕</th>
                        <th>Category</th>
                        <th>Image</th>
                    </tr>
                </thead>
                <tbody>
                    {paginatedProducts.map(p => (
                        <tr key={p._id} title={p.description}>
                            <td>{p._id}</td>
                            <td>{p.title}</td>
                            <td>{p.price.toLocaleString()}đ</td>
                            <td>{p.category?.name || 'N/A'}</td>
                            <td><img src={p.images[0]} width="50" alt="product" /></td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="d-flex justify-content-between">
                <select className="form-select w-auto" value={limit} onChange={(e) => {setLimit(Number(e.target.value)); setPage(1);}}>
                    <option value="5">5 per page</option>
                    <option value="10">10 per page</option>
                    <option value="20">20 per page</option>
                </select>
                
                <div>
                    <button className="btn btn-primary me-2" disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</button>
                    <span>Page {page}</span>
                    <button className="btn btn-primary ms-2" disabled={startIndex + limit >= products.length} onClick={() => setPage(page + 1)}>Next</button>
                </div>
            </div>
        </div>
    );
}