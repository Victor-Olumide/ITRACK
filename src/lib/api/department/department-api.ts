import { appApi } from '../app-api';
import type {
  DepartmentAssetsArgs,
  DepartmentAssetsResponse,
  DepartmentEmployeesArgs,
  DepartmentEmployeesResponse,
  DepartmentWorkspaceResponse,
} from './types';

function queryString(args: object) {
  const params = new URLSearchParams();
  Object.entries(args as Record<string, unknown>).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value));
  });
  const query = params.toString();
  return query ? `?${query}` : '';
}

export const departmentApi = appApi.injectEndpoints({
  endpoints: (builder) => ({
    getDepartmentWorkspace: builder.query<DepartmentWorkspaceResponse, void>({
      query: () => '/department/workspace',
      providesTags: [{ type: 'Department', id: 'WORKSPACE' }],
    }),
    getDepartmentEmployees: builder.query<DepartmentEmployeesResponse, DepartmentEmployeesArgs | void>({
      query: (args) => `/department/employees${queryString(args ?? {})}`,
      providesTags: [{ type: 'Department', id: 'EMPLOYEES' }],
    }),
    getDepartmentAssets: builder.query<DepartmentAssetsResponse, DepartmentAssetsArgs | void>({
      query: (args) => `/department/assets${queryString(args ?? {})}`,
      providesTags: [{ type: 'Department', id: 'ASSETS' }],
    }),
  }),
});

export const {
  useGetDepartmentWorkspaceQuery,
  useGetDepartmentEmployeesQuery,
  useGetDepartmentAssetsQuery,
} = departmentApi;
