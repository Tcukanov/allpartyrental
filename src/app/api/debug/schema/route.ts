import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';

export async function GET(request: NextRequest) {
  try {
    // Get table schema information for Transaction table
    const schemaInfo = await prisma.$queryRaw`
      SELECT 
        column_name, 
        data_type, 
        is_nullable, 
        column_default
      FROM 
        information_schema.columns
      WHERE 
        table_name = 'Transaction'
      ORDER BY 
        ordinal_position;
    `;
    
    // Get table constraints for Transaction table
    const constraintInfo = await prisma.$queryRaw`
      SELECT 
        tc.constraint_name, 
        tc.constraint_type, 
        kcu.column_name,
        ccu.table_name AS referenced_table,
        ccu.column_name AS referenced_column
      FROM 
        information_schema.table_constraints tc
      JOIN 
        information_schema.key_column_usage kcu
      ON 
        tc.constraint_name = kcu.constraint_name
      LEFT JOIN 
        information_schema.constraint_column_usage ccu
      ON 
        ccu.constraint_name = tc.constraint_name
      WHERE 
        tc.table_name = 'Transaction'
      ORDER BY 
        tc.constraint_name, 
        kcu.column_name;
    `;
    
    return NextResponse.json({
      success: true,
      data: {
        schema: schemaInfo,
        constraints: constraintInfo
      }
    });
  } catch (error) {
    console.error('Error fetching schema information:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to fetch schema information' } },
      { status: 500 }
    );
  }
} 