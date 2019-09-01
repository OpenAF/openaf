/**
 * Custom asciitable render 
 * 
 * @author Nuno Aguiar
 * based on de.vandermeer.asciitable.v2.render.WidthLongestWordMaxCol
 *
 */
package openaf.asciitable.render;

import de.vandermeer.asciitable.v2.V2_AsciiTable;
import de.vandermeer.asciitable.v2.render.V2_Width;
import de.vandermeer.asciitable.v2.row.V2_Row;
import de.vandermeer.asciitable.v2.row.ContentRow;
import org.apache.commons.lang3.StringUtils;

public class WidthAnsiLongestWordTab implements V2_Width {

	protected int max;
	protected int[] maxAr;

	public WidthAnsiLongestWordTab(int maxSize) {
		if (maxSize < 3) {
			throw new IllegalArgumentException("Sizeimum column width cannot be smaller than 3");
		}
		this.max = maxSize;
	}

	public WidthAnsiLongestWordTab(int[] maxAr) {
		if (maxAr == null) {
			throw new IllegalArgumentException("maximum array cannot be null");
		}
		for (int m : maxAr) {
			if (m != -1 && m < 3) {
				throw new IllegalArgumentException("array contains maximum column width smaller than 3");
			}
		}
		this.maxAr = maxAr;
	}

	public static int[] longestWord(V2_AsciiTable table) {
		if (table == null) {
			return null;
		}

		if (table.getTable().size() == 0) {
			return new int[0];
		}

		int[] ret = new int[table.getColumnCount()];

		for (V2_Row row : table.getTable()) {
			if (row instanceof ContentRow) {
				ContentRow crow = (ContentRow) row;
				for (int i = 0; i < crow.getColumns().length; i++) {
					if (crow.getColumns()[i] != null) {
						String car = crow.getColumns()[i].toString().replaceAll("\\033\\[[0-9;]*m", "");
						String[] ar = StringUtils.split(car);
						for (int k = 0; k < ar.length; k++) {
							int count = ar[k].length() + crow.getPadding()[i] + crow.getPadding()[i];
							if (count > ret[i]) {
								ret[i] = count;
							}
						}
					}
				}
			}
		}

		return ret;
	}

	@Override
	public int[] getColumnWidths(V2_AsciiTable table) {
		if (table == null) {
			return null;
		}

		if (this.maxAr != null && this.maxAr.length != table.getColumnCount()) {
			throw new IllegalArgumentException("maxAr length is not the same as rows in the table");
		}

		int[] ret = new int[table.getColumnCount()];
		boolean isBigger = false;

		for (V2_Row row : table.getTable()) {
			if (row instanceof ContentRow) {
				ContentRow crow = (ContentRow) row;
				for (int i = 0; i < crow.getColumns().length; i++) {
					if (crow.getColumns()[i] != null) {
						String car = crow.getColumns()[i].toString().replaceAll("\\033\\[[0-9;]*m", "");
						int ln = car.length() + crow.getPadding()[i] + crow.getPadding()[i];
						if (ln > ret[i]) ret[i] = ln;
					}
				}
			}
		}

		int rowSum = 0;
		for(int ii = 0; ii < ret.length; ii++) {
			rowSum += ret[ii] + 2;
		}

		if (rowSum <= this.max) return ret;
		
		/*ret = WidthAnsiLongestWordTab.longestWord(table);

		for (int i = 0; i < ret.length; i++) {
			if (this.max != 0) {
				if (ret[i] > this.max) {
					ret[i] = this.max;
				}
			} else if (this.maxAr != null) {
				if (this.maxAr[i] != -1) {
					if (ret[i] > this.maxAr[i]) {
						ret[i] = this.maxAr[i];
					}
				}
			}
		}*/

		int colSum = 0;
		for (int i = 0; i < ret.length; i++) {
			colSum = colSum + ret[i];
		}

		while (colSum > this.max - (ret.length)) {
			int iMax = -1, iMaxVal = -1;
			int iPeMaxVal = -1;
			for (int i = 0; i < ret.length; i++) {
				if (ret[i] > iMaxVal) {
					iMax = i;
					iMaxVal = ret[i];
				}
				if (ret[i] > iPeMaxVal && ret[i] < iMaxVal) {
					iPeMaxVal = ret[i];
				}
			}
			if (iMax >= 0 && iMaxVal > 9) {
				int tmp = (iPeMaxVal > (ret[iMax] - (colSum - (this.max - ret.length))) ? iPeMaxVal : (ret[iMax] - (colSum - (this.max - ret.length))));
				ret[iMax] = (tmp > 9) ? tmp : 10;
			} else {
				return ret;
			}
			colSum = 0;
			for (int i = 0; i < ret.length; i++) {
				colSum = colSum + ret[i];
			}
		}

		return ret;
	}

}