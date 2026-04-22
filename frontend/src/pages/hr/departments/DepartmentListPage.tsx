import { useMemo, useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef } from 'ag-grid-community';
import { ModuleRegistry, ClientSideRowModelModule, ValidationModule, TextFilterModule, NumberFilterModule, CustomFilterModule } from 'ag-grid-community';

// Register ag-grid modules required for latest v35
ModuleRegistry.registerModules([ClientSideRowModelModule, ValidationModule, TextFilterModule, NumberFilterModule, CustomFilterModule]);

import { useGetDepartmentsQuery } from '../../../features/department/departmentApi';
import type { DepartmentDto } from '../../../types/department';
import { AddDepartmentDrawer } from '../../../features/department/components/AddDepartmentDrawer';
import { EditDepartmentModal } from '../../../features/department/components/EditDepartmentModal';
import { DeleteDepartmentConfirmModal } from '../../../features/department/components/DeleteDepartmentConfirmModal';

export default function DepartmentListPage() {
  const { data: apiResponse, isLoading, isError } = useGetDepartmentsQuery();
  const departments = apiResponse?.data || [];

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentDto | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [searchText, setSearchText] = useState('');

  const [gridApi, setGridApi] = useState<any>(null);

  const onGridReady = (params: any) => {
    setGridApi(params.api);
  };

  useEffect(() => {
    if (gridApi) {
      gridApi.setGridOption('quickFilterText', searchText);
    }
  }, [searchText, gridApi]);

  const handleEdit = (dept: DepartmentDto) => {
    setSelectedDepartment(dept);
    setIsEditModalOpen(true);
  };

  const handleDelete = (dept: DepartmentDto) => {
    setSelectedDepartment(dept);
    setIsDeleteModalOpen(true);
  };

  const colDefs = useMemo<ColDef<DepartmentDto>[]>(() => [
    { 
      field: 'departmentCode', 
      headerName: 'Code', 
      sortable: true, 
      filter: true,
      flex: 1 
    },
    { 
      field: 'departmentName', 
      headerName: 'Name', 
      sortable: true, 
      filter: true,
      flex: 2 
    },
    {
      field: 'status',
      headerName: 'Status',
      sortable: true,
      filter: true,
      flex: 1,
      cellRenderer: (params: any) => {
        const val = params.value;
        let badgeClass = 'bg-slate-100 text-slate-700'; // default
        if (val === 'ACTIVE') badgeClass = 'bg-emerald-100 text-emerald-700';
        else if (val === 'INACTIVE') badgeClass = 'bg-yellow-100 text-yellow-700';
        else if (val === 'DELETED') badgeClass = 'bg-red-100 text-red-700';

        return (
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold leading-none uppercase ${badgeClass}`}>
            {val}
          </span>
        );
      }
    },
    {
      headerName: 'Actions',
      sortable: false,
      filter: false,
      flex: 1,
      cellRenderer: (params: any) => {
        const dept = params.data;
        if (!dept) return null;
        return (
          <div className="flex items-center gap-3 h-full">
            <button
              onClick={() => handleEdit(dept)}
              className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors"
              title="Edit"
            >
              <i className="bi bi-pencil-square"></i>
            </button>
            <button
              onClick={() => handleDelete(dept)}
              className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors"
              title="Disband"
            >
              <i className="bi bi-trash"></i>
            </button>
          </div>
        );
      }
    }
  ], []);

  const defaultColDef = useMemo(() => ({
    resizable: true,
    sortable: true,
    filter: true
  }), []);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Department Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage organizational departments and their statuses.</p>
        </div>
        <button
          onClick={() => setIsAddDrawerOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors"
        >
          <i className="bi bi-plus-lg"></i>
          Add New Department
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col flex-1 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <div className="relative max-w-sm">
            <input
              type="text"
              placeholder="Search departments..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
            />
            <i className="bi bi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"></i>
          </div>
        </div>

        <div className="flex-1 w-full p-0 m-0">
          {isLoading && (
             <div className="flex items-center justify-center h-full">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
             </div>
          )}
          
          {isError && (
             <div className="flex flex-col items-center justify-center h-full text-red-500">
                <i className="bi bi-exclamation-circle text-4xl mb-4"></i>
                <p>Failed to load departments. Please try again.</p>
             </div>
          )}

          {!isLoading && !isError && (
             <div className="h-full w-full ag-theme-alpine" style={{ padding: '0', margin: '0' }}>
               <style>{`
                 .ag-theme-alpine {
                    --ag-borders: none;
                    --ag-header-background-color: #f8fafc;
                    --ag-header-foreground-color: #475569;
                    --ag-cell-horizontal-border: solid 1px #f1f5f9;
                    --ag-font-family: inherit;
                    --ag-font-size: 14px;
                 }
                 .ag-theme-alpine .ag-header-cell-label {
                    font-weight: 700;
                 }
               `}</style>
               <AgGridReact
                 rowData={departments}
                 columnDefs={colDefs}
                 defaultColDef={defaultColDef}
                 pagination={true}
                 paginationPageSize={10}
                 paginationPageSizeSelector={[10, 20, 50]}
                 onGridReady={onGridReady}
                 domLayout="normal"
                 overlayNoRowsTemplate='<span class="text-slate-500 p-4">No departments found.</span>'
               />
             </div>
          )}
        </div>
      </div>

      <AddDepartmentDrawer 
        isOpen={isAddDrawerOpen} 
        onClose={() => setIsAddDrawerOpen(false)} 
      />

      <EditDepartmentModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedDepartment(null);
        }}
        department={selectedDepartment}
      />

      <DeleteDepartmentConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedDepartment(null);
        }}
        department={selectedDepartment}
      />
    </div>
  );
}
