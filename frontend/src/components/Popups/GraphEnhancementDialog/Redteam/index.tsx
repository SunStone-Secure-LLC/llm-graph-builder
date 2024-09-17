import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getRedTeamNodes } from '../../../../services/GetRedTeamNodes';
import linkRedTeamNodes from '../../../../services/LinkRedTeamEntities';
import { redTeamNodes, selectedRedTeamNodes, UserCredentials } from '../../../../types';

import { useCredentials } from '../../../../context/UserCredentials';
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
  getFilteredRowModel,
  getPaginationRowModel,
  Table,
  Row,
  getSortedRowModel,
} from '@tanstack/react-table';
import { Checkbox, DataGrid, DataGridComponents, Flex, Tag, Typography } from '@neo4j-ndl/react';
import Legend from '../../../UI/Legend';
import { DocumentIconOutline } from '@neo4j-ndl/react/icons';
import { calcWordColor } from '@neo4j-devtools/word-color';
import ButtonWithToolTip from '../../../UI/ButtonWithToolTip';

export default function RedTeamTab() {
  const { userCredentials } = useCredentials();
  const [redTeamNodes, setRedTeamNodes] = useState<redTeamNodes[]>([]);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [isLoading, setLoading] = useState<boolean>(false);
  const [redteamAPIloading, setredteamAPIloading] = useState<boolean>(false);
  const tableRef = useRef(null);
  const fetchRedTeamNodes = useCallback(async () => {
    try {
      setLoading(true);
      const redTeamNodesData = await getRedTeamNodes(userCredentials as UserCredentials);
      setLoading(false);
      if (redTeamNodesData.data.status === 'Failed') {
        throw new Error(redTeamNodesData.data.error);
      }
      if (redTeamNodesData.data.data.length) {
        console.log({ redTeamNodesData });
        setRedTeamNodes(redTeamNodesData.data.data);
      } else {
        setRedTeamNodes([]);
      }
    } catch (error) {
      setLoading(false);
      console.log(error);
    }
  }, [userCredentials]);
  useEffect(() => {
    (async () => {
      await fetchRedTeamNodes();
    })();
  }, [userCredentials]);

  const clickHandler = async () => {
    try {
      const selectedNodeMap = table.getSelectedRowModel().rows.map(
        (r): selectedRedTeamNodes => ({
          firstElementId: r.id,
          targetElementIds: r.original.target.map((s) => s.elementId),
        })
      );
      setredteamAPIloading(true);
      const response = await linkRedTeamNodes(userCredentials as UserCredentials, selectedNodeMap);
      table.resetRowSelection();
      table.resetPagination();
      setredteamAPIloading(false);
      if (response.data.status === 'Failed') {
        throw new Error(response.data.error);
      }
    } catch (error) {
      setredteamAPIloading(false);
      console.log(error);
    }
  };

  const columnHelper = createColumnHelper<redTeamNodes>();
  const onRemove = (nodeid: string, targetNodeId: string) => {
    setRedTeamNodes((prev) => {
      return prev.map((d) =>
        (d.e.elementId === nodeid
          ? {
              ...d,
              target: d.target.filter((n) => n.elementId != targetNodeId),
            }
          : d)
      );
    });
  };
  const columns = useMemo(
    () => [
      {
        id: 'Check to Delete All Files',
        header: ({ table }: { table: Table<redTeamNodes> }) => {
          return (
            <Checkbox
              aria-label='header-checkbox'
              checked={table.getIsAllRowsSelected()}
              onChange={table.getToggleAllRowsSelectedHandler()}
            />
          );
        },
        cell: ({ row }: { row: Row<redTeamNodes> }) => {
          return (
            <div className='px-1'>
              <Checkbox
                aria-label='row-checkbox'
                onChange={row.getToggleSelectedHandler()}
                title='Select the Row for Linking'
                checked={row.getIsSelected()}
              />
            </div>
          );
        },
        size: 80,
      },
      columnHelper.accessor((row) => row.e.id, {
        id: 'Id',
        cell: (info) => {
          return (
            <div className='textellipsis'>
              <span title={info.getValue()}>{info.getValue()}</span>
            </div>
          );
        },
        header: () => <span>ID</span>,
        footer: (info) => info.column.id,
      }),
      columnHelper.accessor((row) => row.target, {
        id: 'Red Team Nodes',
        cell: (info) => {
          return (
            <Flex>
              {info.getValue().map((s, index) => (
                <Tag
                  style={{
                    backgroundColor: `${calcWordColor(s.id)}`,
                  }}
                  key={`${s.elementId}${index}`}
                  onRemove={() => {
                    onRemove(info.row.original.e.elementId, s.elementId);
                  }}
                  removeable={true}
                  type='default'
                  size='medium'
                >
                  {s.id}
                </Tag>
              ))}
            </Flex>
          );
        },
      }),
      columnHelper.accessor((row) => row.e.labels, {
        id: 'Labels',
        cell: (info) => {
          return (
            <Flex>
              {info.getValue().map((l, index) => (
                <Legend key={index} title={l} bgColor={calcWordColor(l)}></Legend>
              ))}
            </Flex>
          );
        },
        header: () => <span>Labels</span>,
        footer: (info) => info.column.id,
      }),
      columnHelper.accessor((row) => row.documents, {
        id: 'Relevant Documents',
        cell: (info) => {
          return (
            <Flex className='textellipsis'>
              {Array.from(new Set([...info.getValue()])).map((d, index) => (
                <Flex key={`d${index}`} flexDirection='row'>
                  <span>
                    <DocumentIconOutline className='n-size-token-7' />
                  </span>
                  <span>{d}</span>
                </Flex>
              ))}
            </Flex>
          );
        },
        header: () => <span>Related Documents </span>,
        footer: (info) => info.column.id,
      }),
      columnHelper.accessor((row) => row.chunkConnections, {
        id: 'Connected Chunks',
        cell: (info) => <i>{info?.getValue()}</i>,
        header: () => <span>Connected Chunks</span>,
        footer: (info) => info.column.id,
      }),
    ],
    []
  );
  const table = useReactTable({
    data: redTeamNodes,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      rowSelection,
    },
    onRowSelectionChange: setRowSelection,
    enableGlobalFilter: false,
    autoResetPageIndex: false,
    enableRowSelection: true,
    enableMultiRowSelection: true,
    getRowId: (row) => row.e.elementId,
    enableSorting: true,
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: 5,
      },
    },
  });
  const selectedFilesCheck = redteamAPIloading
    ? 'Linking...'
    : table.getSelectedRowModel().rows.length
    ? `Link Red Team Nodes (${table.getSelectedRowModel().rows.length})`
    : 'Select Node(s) to Link';
  return (
    <div>
      <Flex justifyContent='space-between' flexDirection='row'>
        <Flex>
          <Typography variant='subheading-large'>Refine Your Knowledge Graph: Link Attack Path Entities for Red Teams:</Typography>
          <Typography variant='subheading-small'>
            Identify and link entities that are in an attack path to improve the
            efficiency and focus of your Red Teaming exercise planning using your knowledge graph.
          </Typography>
        </Flex>
        {redTeamNodes.length > 0 && (
          <Typography variant='subheading-large'>Total Red Team Nodes: {redTeamNodes.length}</Typography>
        )}
      </Flex>
      <DataGrid
        ref={tableRef}
        isResizable={true}
        tableInstance={table}
        styling={{
          borderStyle: 'all-sides',
          zebraStriping: true,
          headerStyle: 'clean',
        }}
        rootProps={{
          className: 'max-h-[355px] !overflow-y-auto',
        }}
        isLoading={isLoading}
        components={{
          Body: (props) => <DataGridComponents.Body {...props} />,
          PaginationNumericButton: ({ isSelected, innerProps, ...restProps }) => {
            return (
              <DataGridComponents.PaginationNumericButton
                {...restProps}
                isSelected={isSelected}
                innerProps={{
                  ...innerProps,
                  style: {
                    ...(isSelected && {
                      backgroundSize: '200% auto',
                      borderRadius: '10px',
                    }),
                  },
                }}
              />
            );
          },
        }}
      />
      <Flex className='mt-3' flexDirection='row' justifyContent='flex-end'>
        <ButtonWithToolTip
          onClick={async () => {
            await clickHandler();
            await fetchRedTeamNodes();
          }}
          size='large'
          loading={redteamAPIloading}
          text={
            isLoading
              ? 'Fetching Red Team Nodes'
              : !isLoading && !redTeamNodes.length
              ? 'No Nodes Found'
              : !table.getSelectedRowModel().rows.length
              ? 'No Nodes Selected'
              : redteamAPIloading
              ? 'Linking'
              : `Link Selected Nodes (${table.getSelectedRowModel().rows.length})`
          }
          label='Link Red Team Node Button'
          disabled={!table.getSelectedRowModel().rows.length}
          placement='top'
        >
          {selectedFilesCheck}
        </ButtonWithToolTip>
      </Flex>
    </div>
  );
}
