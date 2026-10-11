import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import UploadModal from '../components/UploadModal';
import ConfirmModal from '../components/ConfirmModal';
import FileCard from '../components/FileCard';
import { AuthProvider } from '../context/AuthContext';

describe('CloudVault Frontend UI Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders Login page with email and password inputs', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText(/name@example.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders Register page and checks password strength feedback indicators', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <RegisterPage />
        </AuthProvider>
      </MemoryRouter>
    );

    const passwordInput = screen.getByPlaceholderText(/min. 8 characters/i);
    expect(passwordInput).toBeInTheDocument();

    // Type a weak password
    fireEvent.change(passwordInput, { target: { value: 'short' } });
    expect(screen.getByText(/8\+ characters/i)).toBeInTheDocument();
    expect(screen.getByText(/uppercase letter/i)).toBeInTheDocument();

    // Type a strong compliant password
    fireEvent.change(passwordInput, { target: { value: 'StrongPassword123' } });
    expect(screen.getByText(/number digit/i)).toBeInTheDocument();
  });

  it('validates password mismatch on registration', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <RegisterPage />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/john doe/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByPlaceholderText(/john@example.com/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/min. 8 characters/i), { target: { value: 'Password123!' } });
    fireEvent.change(screen.getByPlaceholderText(/re-enter password/i), { target: { value: 'Mismatched123!' } });

    fireEvent.click(screen.getByRole('button', { name: /complete registration/i }));

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('renders UploadModal with drag-and-drop zone and validation constraints', () => {
    render(
      <UploadModal isOpen={true} onClose={() => {}} onUploadSuccess={() => {}} />
    );

    expect(screen.getByText(/drag & drop your file here/i)).toBeInTheDocument();
    expect(screen.getByText(/maximum file size: 10 mb/i)).toBeInTheDocument();
  });

  it('renders ConfirmModal with warning message and action buttons', () => {
    const onConfirmMock = vi.fn();
    const onCancelMock = vi.fn();

    render(
      <ConfirmModal
        isOpen={true}
        title="Delete Test Document?"
        message="This will delete the file from AWS S3."
        confirmText="Confirm Delete"
        onConfirm={onConfirmMock}
        onCancel={onCancelMock}
      />
    );

    expect(screen.getByText(/delete test document\?/i)).toBeInTheDocument();
    expect(screen.getByText(/this will delete the file from aws s3/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /confirm delete/i }));
    expect(onConfirmMock).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancelMock).toHaveBeenCalledTimes(1);
  });

  it('renders FileCard with formatted metadata and action buttons', () => {
    const mockFile = {
      id: 'file-123',
      original_filename: 'financial_report.pdf',
      content_type: 'application/pdf',
      file_size: 1048576, // 1 MB
      created_at: '2026-10-11T12:00:00Z',
      share_count: 2,
    };

    const downloadMock = vi.fn();

    render(
      <FileCard
        file={mockFile}
        onDownload={downloadMock}
        onShare={() => {}}
        onDelete={() => {}}
      />
    );

    expect(screen.getByText('financial_report.pdf')).toBeInTheDocument();
    expect(screen.getByText(/1 mb/i)).toBeInTheDocument();
    expect(screen.getByText(/2 shared/i)).toBeInTheDocument();

    const downloadBtn = screen.getByTitle(/download file/i);
    fireEvent.click(downloadBtn);
    expect(downloadMock).toHaveBeenCalledWith(mockFile);
  });
});
