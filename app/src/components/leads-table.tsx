"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, MoreHorizontal, CheckCircle, Mail, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export type Lead = {
  id: string
  email: string
  contactName: string | null
  status: string
  source: string
  emailStatus: string
  emailScore: number | null
  createdAt: Date
  company: {
    id: string
    name: string
    website: string | null
    phone: string | null
    address: string | null
    hours: string | null
    description: string | null
    services: string | null
    rating: number | null
    reviews: number | null
    yearsInBusiness: number | null
    googleGuaranteed: boolean
  }
}

export const columns: ColumnDef<Lead>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: "company",
    accessorFn: (row) => row.company.name,
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Company
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => (
      <div className="space-y-1">
        <div className="font-medium">{row.original.company.name}</div>
        {row.original.company.website && (
          <div className="text-xs text-muted-foreground">
            {row.original.company.website}
          </div>
        )}
      </div>
    ),
  },
  {
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Contact
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => (
      <div className="space-y-1">
        <div className="text-sm">{row.getValue("email")}</div>
        {row.original.contactName && (
          <div className="text-xs text-muted-foreground">
            {row.original.contactName}
          </div>
        )}
        <div className="flex items-center space-x-1">
          <Badge 
            variant={
              row.original.emailStatus === 'VALID' ? 'default' :
              row.original.emailStatus === 'INVALID' ? 'destructive' :
              row.original.emailStatus === 'UNVERIFIED' ? 'secondary' :
              'outline'
            }
            className="text-xs"
          >
            {row.original.emailStatus === 'UNVERIFIED' ? 'Unverified' : row.original.emailStatus}
          </Badge>
        </div>
      </div>
    ),
  },
  {
    id: "phone",
    accessorFn: (row) => row.company.phone,
    header: "Phone",
    cell: ({ row }) => (
      <div className="text-sm">
        {row.original.company.phone || <span className="text-muted-foreground">—</span>}
      </div>
    ),
  },
  {
    id: "address",
    accessorFn: (row) => row.company.address,
    header: "Location",
    cell: ({ row }) => (
      <div className="text-sm max-w-[200px] truncate">
        {row.original.company.address || <span className="text-muted-foreground">—</span>}
      </div>
    ),
  },
  {
    id: "rating",
    accessorFn: (row) => row.company.rating,
    header: "Rating",
    cell: ({ row }) => {
      const rating = row.original.company.rating;
      const reviews = row.original.company.reviews;
      const googleGuaranteed = row.original.company.googleGuaranteed;
      
      if (!rating) return <span className="text-muted-foreground text-sm">—</span>;
      
      return (
        <div className="space-y-1">
          <div className="flex items-center space-x-1">
            <span className="text-sm font-medium">⭐ {rating}</span>
            {reviews && <span className="text-xs text-muted-foreground">({reviews})</span>}
          </div>
          {googleGuaranteed && (
            <Badge variant="default" className="text-xs bg-blue-100 text-blue-800">
              Google Guaranteed
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    id: "business_info",
    accessorFn: (row) => row.company.yearsInBusiness,
    header: "Business",
    cell: ({ row }) => {
      const years = row.original.company.yearsInBusiness;
      const hours = row.original.company.hours;
      
      return (
        <div className="space-y-1">
          {years && (
            <div className="text-xs text-muted-foreground">
              {years} year{years !== 1 ? 's' : ''} in business
            </div>
          )}
          {hours && (
            <div className="text-xs text-muted-foreground max-w-[150px] truncate">
              {hours}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge
          variant={
            status === "NEW" ? "default" :
            status === "CONTACTED" ? "secondary" :
            status === "REPLIED" ? "default" :
            status === "UNSUBSCRIBED" ? "destructive" :
            "outline"
          }
          className="text-xs"
        >
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: "source",
    header: "Source",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-xs">
        {row.getValue("source")}
      </Badge>
    ),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Added
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = row.getValue("createdAt") as Date
      return <div className="text-sm">{date.toLocaleDateString()}</div>
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const lead = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(lead.email)}
            >
              Copy email address
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {lead.emailStatus === 'UNVERIFIED' && (
              <DropdownMenuItem
                onClick={() => verifyEmail(lead.id, lead.email)}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Verify email
              </DropdownMenuItem>
            )}
            <DropdownMenuItem>
              <Mail className="mr-2 h-4 w-4" />
              Add to campaign
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Edit lead</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              Delete lead
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

interface LeadsTableProps {
  data: Lead[]
}

const verifyEmail = async (leadId: string, email: string) => {
  try {
    const response = await fetch('/api/verify-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ leadId, email }),
    })
    
    if (response.ok) {
      // Refresh the page to show updated verification status
      window.location.reload()
    }
  } catch (error) {
    console.error('Error verifying email:', error)
  }
}

const verifyEmailsBulk = async (leadIds: string[]) => {
  try {
    const response = await fetch('/api/verify-emails-bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ leadIds }),
    })
    
    if (response.ok) {
      // Refresh the page to show updated verification status
      window.location.reload()
    }
  } catch (error) {
    console.error('Error bulk verifying emails:', error)
  }
}

const deleteLeadsBulk = async (leadIds: string[]) => {
  if (!confirm(`Are you sure you want to delete ${leadIds.length} lead${leadIds.length > 1 ? 's' : ''}? This action cannot be undone.`)) {
    return
  }

  try {
    const response = await fetch('/api/leads/bulk-delete', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ leadIds }),
    })
    
    if (response.ok) {
      // Refresh the page to show updated leads
      window.location.reload()
    } else {
      const errorData = await response.json()
      alert(`Error deleting leads: ${errorData.error}`)
    }
  } catch (error) {
    console.error('Error deleting leads:', error)
    alert('Error deleting leads. Please try again.')
  }
}

export function LeadsTable({ data }: LeadsTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  const selectedRows = table.getFilteredSelectedRowModel().rows
  const unverifiedSelectedLeads = selectedRows.filter(row => row.original.emailStatus === 'UNVERIFIED')

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter by company name..."
          value={(table.getColumn("company")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("company")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        {selectedRows.length > 0 && (
          <Button
            onClick={() => {
              const leadIds = selectedRows.map(row => row.original.id)
              deleteLeadsBulk(leadIds)
            }}
            className="ml-4"
            variant="destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete {selectedRows.length} Lead{selectedRows.length > 1 ? 's' : ''}
          </Button>
        )}
        {unverifiedSelectedLeads.length > 0 && (
          <Button
            onClick={() => {
              const leadIds = unverifiedSelectedLeads.map(row => row.original.id)
              verifyEmailsBulk(leadIds)
            }}
            className="ml-4"
            variant="default"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Verify {unverifiedSelectedLeads.length} Email{unverifiedSelectedLeads.length > 1 ? 's' : ''}
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}