import { Button, Table } from 'flowbite-react';
import { Link } from 'react-router-dom';
import { HiArrowRight, HiTableCells } from 'react-icons/hi2';

// A reusable table for displaying lists of recent data.
export default function RecentDataTable({ title, headers, data, renderRow, linkTo }) {
    return (
        <section className='dashboard-table-card'>
            <div className='dashboard-table-card__header'>
                <div className='dashboard-table-card__title-group'>
                    <span className='dashboard-table-card__icon' aria-hidden='true'>
                        <HiTableCells className='h-4 w-4' />
                    </span>
                    <div>
                        <h2>{title}</h2>
                        <p>{data?.length || 0} recent records</p>
                    </div>
                </div>
                <Button as={Link} to={linkTo} color='light' size='xs' pill>
                    See all
                    <HiArrowRight className='ml-2 h-3.5 w-3.5' />
                </Button>
            </div>
            <div className='dashboard-table-card__scroll'>
                <Table hoverable className='dashboard-table-card__table'>
                    <Table.Head>
                        {/* Dynamically create table headers */}
                        {headers.map((header) => (
                            <Table.HeadCell key={header}>{header}</Table.HeadCell>
                        ))}
                    </Table.Head>
                    {data && data.length > 0 ? (
                        data.map((item) => renderRow(item)) // Use the renderRow function prop
                    ) : (
                        <Table.Body>
                            <Table.Row>
                                <Table.Cell colSpan={headers.length} className='text-center py-4'>
                                    No data to show.
                                </Table.Cell>
                            </Table.Row>
                        </Table.Body>
                    )}
                </Table>
            </div>
        </section>
    );
}
