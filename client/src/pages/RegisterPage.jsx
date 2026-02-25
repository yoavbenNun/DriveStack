import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    name: '',
    password: '',
    confirmPassword: '',
    image: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };


  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };


  //check password validity
  const validatePassword = (pwd) => {
    if (pwd.length < 8) {
      return "Password must be at least 8 characters long.";
    }
    // check for at least one English letter
    if (!/[a-zA-Z]/.test(pwd)) {
      return "Password must contain at least one English letter.";
    }
    return null; // valid password
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    // validate password
    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    // check password match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    setLoading(true);

    try {
      // send registration request to server
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          email: formData.email,
          name: formData.name,
          image: formData.image
        }),
      });

      if (!response.ok) {
        throw new Error('Registration failed. Username might be taken.');
      }

      // Successful registration
      alert("Registration successful! Please login.");
      navigate('/login');

    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Create Account</h2>
        
        <form onSubmit={handleRegister}>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <label htmlFor="avatar-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: '80px', height: '80px', borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.05)', border: '2px dashed #555',
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                overflow: 'hidden', 
                backgroundImage: formData.image ? `url(${formData.image})` : 'none',
                backgroundSize: 'cover', backgroundPosition: 'center',
                transition: 'border 0.3s ease'
              }}>
                {!formData.image && <span style={{ color: '#888', fontSize: '2rem' }}>+</span>}
              </div>
              <span style={{ fontSize: '0.85rem', color: '#aaa', marginTop: '10px' }}>Add Profile Picture</span>
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageChange}
            />
          </div>

          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="Choose a username"
            />
          </div>

          <div className="form-group">
            <label>Display Name (Optional)</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="How should we call you?"
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label>Password</label> 
              <span style={{ fontSize: '0.75rem', color: '#636e72', fontStyle: 'italic' }}>
                (Min 8 chars, 1 letter)
              </span>
            </div>
        
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Create a password"
            />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Repeat password"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <p style={{ marginTop: '15px', fontSize: '0.9rem' }}>
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;