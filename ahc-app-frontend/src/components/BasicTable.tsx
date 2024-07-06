import { Button } from "@mui/material";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import React from "react";
import { AnyObject } from "../pages/type";

const BasicTable: React.FC<{
  values: AnyObject[];
  targetColumns?: string[];
  columnOnClick?: (col: string) => void;
}> = ({ values, targetColumns, columnOnClick }) => {
  console.log(values);
  const keys = Object.keys(values[0]);

  return (
    <TableContainer component={Paper}>
      <Table aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>TestCase</TableCell>
            {keys.map((key) => {
              if (
                targetColumns &&
                columnOnClick &&
                targetColumns.includes(key)
              ) {
                console.log(key);
                return (
                  <TableCell align="right">
                    <Button onClick={() => columnOnClick(key)}>{key}</Button>
                  </TableCell>
                );
              } else return <TableCell align="right">{key}</TableCell>;
            })}
          </TableRow>
        </TableHead>
        <TableBody>
          {values.map((value, index) => (
            <TableRow
              key={index}
              sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                {index}
              </TableCell>
              {keys.map((key) => (
                <TableCell align="right">{value[key]}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
export default BasicTable;
