import React, { Component } from 'react';
import './DatabaseDemo.css';

class DatabaseDemo extends Component {
  state = { students: [], name: '', salary: '', field: '', editingId: null, message: '' };

  componentDidMount() { this.loadStudents(); }

  async loadStudents() {
    try {
      const response = await fetch('/api/students');
      const data = await response.json();
      this.setState({ students: data.result || [] });
    } catch (error) { this.setState({ message: 'Could not load students.' }); }
  }

  handleChange = (event) => this.setState({ [event.target.name]: event.target.value });

  saveStudent = async (event) => {
    event.preventDefault();
    const { name, salary, field, editingId } = this.state;
    if (!name.trim() || !salary.trim() || !field.trim()) {
      this.setState({ message: 'Please fill all student fields.' });
      return;
    }
    try {
      const response = await fetch(editingId ? `/api/students/${editingId}` : '/api/students', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, salary, field })
      });
      if (response.ok) {
        this.setState({ name: '', salary: '', field: '', editingId: null, message: editingId ? 'Student updated.' : 'Student added.' });
        this.loadStudents();
      } else this.setState({ message: 'Could not save student.' });
    } catch (error) { this.setState({ message: 'Backend is not running.' }); }
  };

  editStudent = (student) => this.setState({ name: student.name, salary: student.salary, field: student.field, editingId: student.id, message: '' });

  deleteStudent = async (id) => {
    try {
      const response = await fetch(`/api/students/${id}`, { method: 'DELETE' });
      if (response.ok) { this.setState({ message: 'Student deleted.' }); this.loadStudents(); }
      else this.setState({ message: 'Could not delete student.' });
    } catch (error) { this.setState({ message: 'Backend is not running.' }); }
  };

  render() {
    const { students, name, salary, field, editingId, message } = this.state;
    return <div className="student-crud"><header className="crud-header"><div><span className="crud-brand">S</span><span className="crud-brand-name">StudentOS</span></div><span className="crud-role">ADMIN PORTAL</span></header><section className="crud-intro"><div><p className="crud-kicker">STUDENT MANAGEMENT</p><h1>Student records</h1><p className="crud-subtitle">Keep your student information accurate and up to date.</p></div><div className="record-count"><strong>{students.length}</strong><span>total records</span></div></section><form className="student-form" onSubmit={this.saveStudent}><div className="form-field"><label htmlFor="student-name">Student name</label><input id="student-name" name="name" value={name} onChange={this.handleChange} placeholder="e.g. Aarav Mehta" aria-label="Student name" /></div><div className="form-field"><label htmlFor="student-salary">Salary</label><input id="student-salary" name="salary" value={salary} onChange={this.handleChange} placeholder="e.g. 25000" aria-label="Salary" /></div><div className="form-field"><label htmlFor="student-field">Field</label><input id="student-field" name="field" value={field} onChange={this.handleChange} placeholder="e.g. AWS" aria-label="Field" /></div><button type="submit">{editingId ? 'Update student' : 'Add student'}</button>{editingId && <button type="button" className="cancel-button" onClick={() => this.setState({ name: '', salary: '', field: '', editingId: null })}>Cancel</button>}</form>{message && <p className="crud-message" role="status">{message}</p>}<section className="table-card"><div className="table-title"><div><h2>All students</h2><p>Manage the records stored in your database.</p></div><span className="live-dot">Live data</span></div><div className="table-scroll"><table id="students"><thead><tr><th>ID</th><th>NAME</th><th>SALARY</th><th>FIELD</th><th>ACTIONS</th></tr></thead><tbody>{students.map((student) => <tr key={student.id}><td><span className="id-badge">#{student.id}</span></td><td className="name-cell">{student.name}</td><td className="salary-cell">{student.salary}</td><td className="field-cell">{student.field}</td><td><button onClick={() => this.editStudent(student)}>Edit</button><button className="delete-button" onClick={() => this.deleteStudent(student.id)}>Delete</button></td></tr>)}</tbody></table>{students.length === 0 && <p className="empty-crud">No students found.</p>}</div></section></div>;
  }
}

export default DatabaseDemo;
