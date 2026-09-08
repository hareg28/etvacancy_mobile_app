import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@constants/index';

export interface ColumnDef<T> {
  key: string;
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  filterOptions?: { label: string; value: string }[];
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  defaultHidden?: boolean;
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  keyExtractor: (item: T) => string;
  title?: string;
  subtitle?: string;
  searchPlaceholder?: string;
  onRowPress?: (item: T) => void;
  initialPageSize?: number;
  headerActions?: React.ReactNode;
  isLoading?: boolean;
  emptyMessage?: string;
  enableSearch?: boolean;
  enableFilters?: boolean;
}

export function DataTable<T extends Record<string, any>>({
  data = [],
  columns = [],
  keyExtractor,
  title,
  subtitle,
  searchPlaceholder = 'Search records...',
  onRowPress,
  initialPageSize = 10,
  headerActions,
  isLoading = false,
  emptyMessage = 'No records found.',
  enableSearch = true,
  enableFilters = true,
}: DataTableProps<T>) {
  // ── Core State ──────────────────────────────────────────────────────────────
  const [globalSearch, setGlobalSearch] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = initialPageSize;

  // ── Filter Modal State ──────────────────────────────────────────────────────
  // Step 1: choose which column to filter by
  // Step 2: choose/type the filter value for that column
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterStep, setFilterStep] = useState<'pick-column' | 'pick-value'>('pick-column');
  const [filteringCol, setFilteringCol] = useState<ColumnDef<T> | null>(null);
  const [filterTextInput, setFilterTextInput] = useState('');

  // ── Columns Visibility ──────────────────────────────────────────────────────
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    columns.forEach((col) => { initial[col.key] = !col.defaultHidden; });
    return initial;
  });
  const [showColumnsModal, setShowColumnsModal] = useState(false);

  const activeColumns = useMemo(
    () => columns.filter((col) => visibleColumns[col.key] !== false),
    [columns, visibleColumns],
  );

  const toggleColumnVisibility = useCallback((key: string) => {
    setVisibleColumns((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (!Object.values(next).some(Boolean)) return prev;
      return next;
    });
  }, []);

  // ── Open filter modal ───────────────────────────────────────────────────────
  const openFilterModal = useCallback(() => {
    setFilterStep('pick-column');
    setFilteringCol(null);
    setFilterTextInput('');
    setShowFilterModal(true);
  }, []);

  // ── Step 1 → 2: pick a column ───────────────────────────────────────────────
  const selectFilterColumn = useCallback((col: ColumnDef<T>) => {
    setFilteringCol(col);
    setFilterTextInput(
      col.filterOptions ? '' : (columnFilters[col.key] !== 'ALL' ? columnFilters[col.key] ?? '' : ''),
    );
    setFilterStep('pick-value');
  }, [columnFilters]);

  // ── Apply filter value ──────────────────────────────────────────────────────
  const applyFilter = useCallback((colKey: string, value: string) => {
    setColumnFilters((prev) => ({ ...prev, [colKey]: value || 'ALL' }));
    setCurrentPage(1);
    setShowFilterModal(false);
  }, []);

  const applyTextFilter = useCallback(() => {
    if (!filteringCol) return;
    applyFilter(filteringCol.key, filterTextInput.trim());
  }, [filteringCol, filterTextInput, applyFilter]);

  const clearColumnFilter = useCallback((colKey: string) => {
    setColumnFilters((prev) => ({ ...prev, [colKey]: 'ALL' }));
    setCurrentPage(1);
  }, []);

  const clearAllFilters = useCallback(() => {
    setColumnFilters({});
    setCurrentPage(1);
  }, []);

  // ── Sort ────────────────────────────────────────────────────────────────────
  const handleSort = useCallback((key: string) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  }, [sortKey]);

  // ── Filtering Logic ─────────────────────────────────────────────────────────
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      // Global search
      if (globalSearch.trim()) {
        const query = globalSearch.toLowerCase().trim();
        const matches = columns.some((col) => {
          const val = col.accessorKey ? row[col.accessorKey] : row[col.key];
          return val != null && String(val).toLowerCase().includes(query);
        });
        if (!matches) return false;
      }

      // Per-column filters
      for (const [colKey, filterVal] of Object.entries(columnFilters)) {
        if (!filterVal || filterVal === 'ALL') continue;
        const colDef = columns.find((c) => c.key === colKey);
        const val = colDef?.accessorKey ? row[colDef.accessorKey] : row[colKey];
        const strVal = String(val ?? '').toLowerCase();

        if (colDef?.filterOptions && colDef.filterOptions.length > 0) {
          // Exact match for option-based filters
          if (strVal !== filterVal.toLowerCase()) return false;
        } else {
          // Contains match for free-text filters
          if (!strVal.includes(filterVal.toLowerCase())) return false;
        }
      }
      return true;
    });
  }, [data, columns, globalSearch, columnFilters]);

  // ── Sorting Logic ───────────────────────────────────────────────────────────
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    const colDef = columns.find((c) => c.key === sortKey);
    return [...filteredData].sort((a, b) => {
      const valA = colDef?.accessorKey ? a[colDef.accessorKey] : a[sortKey];
      const valB = colDef?.accessorKey ? b[colDef.accessorKey] : b[sortKey];
      if (valA === valB) return 0;
      if (valA == null) return 1;
      if (valB == null) return -1;
      const comp = String(valA).localeCompare(String(valB), undefined, { numeric: true });
      return sortOrder === 'asc' ? comp : -comp;
    });
  }, [filteredData, sortKey, sortOrder, columns]);

  // ── Pagination ──────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const activeFiltersCount = Object.values(columnFilters).filter((v) => v && v !== 'ALL').length;

  // Filterable columns = all columns that have a key + accessor (i.e. can be filtered)
  const filterableColumns = useMemo(
    () => columns.filter((c) => c.key !== 'actions'),
    [columns],
  );

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>

      {/* ─── TITLE ROW ────────────────────────────────────────────────────── */}
      {(title || headerActions) && (
        <View style={styles.topTitleBar}>
          <View style={{ flex: 1 }}>
            {title && <Text style={styles.tableTitle}>{title}</Text>}
            {subtitle && <Text style={styles.tableSubtitle}>{subtitle}</Text>}
          </View>
          {headerActions}
        </View>
      )}

      {/* ─── TOOLBAR: Search + Filter + Columns ───────────────────────────── */}
      {(enableSearch || enableFilters) && (
        <View style={styles.toolbar}>
          {/* Global Search */}
          {enableSearch && (
            <View style={styles.searchContainer}>
              <Ionicons name="search-outline" size={16} color="#64748B" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder={searchPlaceholder}
                placeholderTextColor="#94A3B8"
                value={globalSearch}
                onChangeText={(text) => { setGlobalSearch(text); setCurrentPage(1); }}
              />
              {globalSearch ? (
                <TouchableOpacity onPress={() => setGlobalSearch('')} style={styles.clearBtn}>
                  <Ionicons name="close-circle" size={16} color="#94A3B8" />
                </TouchableOpacity>
              ) : null}
            </View>
          )}

          {enableFilters && (
            <View style={styles.toolbarActions}>
              {/* Filter by Column Button */}
              <TouchableOpacity
                style={[styles.actionBtn, activeFiltersCount > 0 && styles.actionBtnActive]}
                onPress={openFilterModal}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="funnel-outline"
                  size={15}
                  color={activeFiltersCount > 0 ? '#FFFFFF' : '#475569'}
                />
                <Text style={[styles.actionBtnText, activeFiltersCount > 0 && { color: '#FFFFFF' }]}>
                  Filter{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
                </Text>
              </TouchableOpacity>

              {/* Columns Visibility */}
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => setShowColumnsModal(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="options-outline" size={15} color={COLORS.primary} />
                <Text style={styles.actionBtnText}>Columns</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* ─── ACTIVE FILTER CHIPS ──────────────────────────────────────────── */}
      {activeFiltersCount > 0 && (
        <View style={styles.filterChipsBar}>
          <Text style={styles.filterChipLabel}>Active:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
            {Object.entries(columnFilters).map(([key, val]) => {
              if (!val || val === 'ALL') return null;
              const colDef = columns.find((c) => c.key === key);
              const optLabel = colDef?.filterOptions?.find((o) => o.value === val)?.label ?? val;
              return (
                <View key={key} style={styles.filterChip}>
                  <Ionicons name="funnel" size={10} color="#1D4ED8" style={{ marginRight: 3 }} />
                  <Text style={styles.filterChipText}>
                    {colDef?.header}: <Text style={{ fontWeight: '700' }}>{optLabel}</Text>
                  </Text>
                  <TouchableOpacity onPress={() => clearColumnFilter(key)} style={{ marginLeft: 5 }}>
                    <Ionicons name="close-circle" size={13} color="#64748B" />
                  </TouchableOpacity>
                </View>
              );
            })}
            <TouchableOpacity onPress={clearAllFilters} style={styles.clearAllChip}>
              <Text style={styles.clearAllChipText}>Clear all</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* ─── TABLE (Horizontal Scroll) ────────────────────────────────────── */}
      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View style={{ minWidth: '100%' }}>
          {/* Header Row */}
          <View style={styles.headerRow}>
            {activeColumns.map((col) => {
              const isSorted = sortKey === col.key;
              const canSort = col.sortable !== false;
              const isFiltered = !!(columnFilters[col.key] && columnFilters[col.key] !== 'ALL');
              return (
                <TouchableOpacity
                  key={col.key}
                  style={[
                    styles.headerCell,
                    col.width ? { width: col.width as any } : { flex: 1 },
                    col.align === 'center' ? { alignItems: 'center' }
                      : col.align === 'right' ? { alignItems: 'flex-end' } : undefined,
                  ]}
                  disabled={!canSort}
                  onPress={() => canSort && handleSort(col.key)}
                  activeOpacity={canSort ? 0.7 : 1}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={[styles.headerCellText, isFiltered && { color: '#1D4ED8' }]}>
                      {col.header}
                    </Text>
                    {isFiltered && (
                      <Ionicons name="funnel" size={10} color="#1D4ED8" />
                    )}
                    {canSort && (
                      <Ionicons
                        name={
                          isSorted
                            ? sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'
                            : 'swap-vertical-outline'
                        }
                        size={12}
                        color={isSorted ? COLORS.primary : '#94A3B8'}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Body Rows */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.loadingText}>Loading records...</Text>
            </View>
          ) : paginatedData.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-open-outline" size={32} color="#94A3B8" />
              <Text style={styles.emptyText}>{emptyMessage}</Text>
              {activeFiltersCount > 0 && (
                <TouchableOpacity
                  onPress={clearAllFilters}
                  style={{ marginTop: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: '#EFF6FF' }}
                >
                  <Text style={{ fontSize: 12, color: '#1D4ED8', fontWeight: '700' }}>Clear all filters</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            paginatedData.map((row, idx) => {
              const rowKey = keyExtractor(row);
              const isEven = idx % 2 === 0;
              return (
                <TouchableOpacity
                  key={rowKey}
                  style={[styles.dataRow, isEven ? styles.evenRow : styles.oddRow]}
                  disabled={!onRowPress}
                  onPress={() => onRowPress?.(row)}
                  activeOpacity={0.7}
                >
                  {activeColumns.map((col) => {
                    const value = col.accessorKey ? row[col.accessorKey] : row[col.key];
                    return (
                      <View
                        key={col.key}
                        style={[
                          styles.dataCell,
                          col.width ? { width: col.width as any } : { flex: 1 },
                          col.align === 'center' ? { alignItems: 'center' }
                            : col.align === 'right' ? { alignItems: 'flex-end' } : undefined,
                        ]}
                      >
                        {col.cell ? col.cell(row, idx) : (
                          <Text style={styles.cellText}>{String(value ?? '--')}</Text>
                        )}
                      </View>
                    );
                  })}
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* ─── FOOTER PAGINATION ────────────────────────────────────────────── */}
      <View style={styles.footer}>
        <Text style={styles.footerInfoText}>
          Showing {sortedData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}–
          {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length}
          {activeFiltersCount > 0 && (
            <Text style={{ color: '#1D4ED8' }}> (filtered from {data.length})</Text>
          )}
        </Text>
        <View style={styles.paginationControls}>
          <TouchableOpacity
            style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]}
            disabled={currentPage === 1}
            onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            <Ionicons name="chevron-back" size={16} color={currentPage === 1 ? '#CBD5E1' : '#334155'} />
          </TouchableOpacity>
          <Text style={styles.pageNumberText}>Page {currentPage} of {totalPages}</Text>
          <TouchableOpacity
            style={[styles.pageBtn, currentPage === totalPages && styles.pageBtnDisabled]}
            disabled={currentPage === totalPages}
            onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            <Ionicons name="chevron-forward" size={16} color={currentPage === totalPages ? '#CBD5E1' : '#334155'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: FILTER  (2-step: pick column → pick value)
      ═══════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFilterModal(false)}
        >
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>

            {/* ── STEP 1: Pick a column to filter by ──────────────────────── */}
            {filterStep === 'pick-column' && (
              <>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalTitle}>Filter by Column</Text>
                    <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                      Select which column to filter
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                    <Ionicons name="close" size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={{ maxHeight: 360 }}>
                  {filterableColumns.map((col) => {
                    const isActive = !!(columnFilters[col.key] && columnFilters[col.key] !== 'ALL');
                    const activeVal = isActive
                      ? (col.filterOptions?.find((o) => o.value === columnFilters[col.key])?.label ?? columnFilters[col.key])
                      : null;

                    return (
                      <TouchableOpacity
                        key={col.key}
                        style={[styles.columnFilterItem, isActive && styles.columnFilterItemActive]}
                        onPress={() => selectFilterColumn(col)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.columnFilterIcon}>
                          <Ionicons
                            name={isActive ? 'funnel' : 'funnel-outline'}
                            size={16}
                            color={isActive ? '#1D4ED8' : '#64748B'}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.columnFilterLabel, isActive && { color: '#1D4ED8' }]}>
                            {col.header}
                          </Text>
                          {isActive && (
                            <Text style={styles.columnFilterActiveVal}>
                              Filtered: {activeVal}
                            </Text>
                          )}
                        </View>
                        {isActive && (
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation?.();
                              clearColumnFilter(col.key);
                            }}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Ionicons name="close-circle" size={18} color="#94A3B8" />
                          </TouchableOpacity>
                        )}
                        <Ionicons name="chevron-forward" size={16} color="#CBD5E1" style={{ marginLeft: 4 }} />
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {activeFiltersCount > 0 && (
                  <TouchableOpacity style={styles.clearAllBtn} onPress={() => { clearAllFilters(); setShowFilterModal(false); }}>
                    <Ionicons name="trash-outline" size={14} color="#DC2626" />
                    <Text style={styles.clearAllBtnText}>Clear All Filters</Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            {/* ── STEP 2: Pick a value for the selected column ─────────────── */}
            {filterStep === 'pick-value' && filteringCol && (
              <>
                <View style={styles.modalHeader}>
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                    onPress={() => setFilterStep('pick-column')}
                  >
                    <Ionicons name="chevron-back" size={18} color="#1D4ED8" />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#1D4ED8' }}>Back</Text>
                  </TouchableOpacity>
                  <Text style={styles.modalTitle}>{filteringCol.header}</Text>
                  <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                    <Ionicons name="close" size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>
                <Text style={{ fontSize: 12, color: '#64748B', marginBottom: 14 }}>
                  Select a value to filter the <Text style={{ fontWeight: '700', color: '#0F172A' }}>{filteringCol.header}</Text> column
                </Text>

                {filteringCol.filterOptions && filteringCol.filterOptions.length > 0 ? (
                  /* Badge Options */
                  <View style={{ gap: 8 }}>
                    {/* All / No filter */}
                    <TouchableOpacity
                      style={[
                        styles.filterValueRow,
                        (!columnFilters[filteringCol.key] || columnFilters[filteringCol.key] === 'ALL') &&
                          styles.filterValueRowActive,
                      ]}
                      onPress={() => applyFilter(filteringCol.key, 'ALL')}
                    >
                      <View style={[
                        styles.filterValueRadio,
                        (!columnFilters[filteringCol.key] || columnFilters[filteringCol.key] === 'ALL') &&
                          styles.filterValueRadioActive,
                      ]}>
                        {(!columnFilters[filteringCol.key] || columnFilters[filteringCol.key] === 'ALL') && (
                          <View style={styles.filterValueRadioDot} />
                        )}
                      </View>
                      <Text style={styles.filterValueLabel}>All (no filter)</Text>
                    </TouchableOpacity>

                    {filteringCol.filterOptions.map((opt) => {
                      const isSelected = columnFilters[filteringCol.key] === opt.value;
                      return (
                        <TouchableOpacity
                          key={opt.value}
                          style={[styles.filterValueRow, isSelected && styles.filterValueRowActive]}
                          onPress={() => applyFilter(filteringCol.key, opt.value)}
                        >
                          <View style={[styles.filterValueRadio, isSelected && styles.filterValueRadioActive]}>
                            {isSelected && <View style={styles.filterValueRadioDot} />}
                          </View>
                          <Text style={[styles.filterValueLabel, isSelected && { color: '#1D4ED8', fontWeight: '700' }]}>
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  /* Free-text input */
                  <View style={{ gap: 12 }}>
                    <TextInput
                      style={styles.filterTextBox}
                      placeholder={`Type to filter ${filteringCol.header}...`}
                      placeholderTextColor="#94A3B8"
                      value={filterTextInput}
                      onChangeText={setFilterTextInput}
                      autoFocus
                    />
                    <TouchableOpacity style={styles.applyBtn} onPress={applyTextFilter}>
                      <Text style={styles.applyBtnText}>Apply Filter</Text>
                    </TouchableOpacity>
                    {columnFilters[filteringCol.key] && columnFilters[filteringCol.key] !== 'ALL' && (
                      <TouchableOpacity
                        style={styles.clearBtn2}
                        onPress={() => { clearColumnFilter(filteringCol.key); setShowFilterModal(false); }}
                      >
                        <Text style={styles.clearBtn2Text}>Clear this filter</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: VISIBLE COLUMNS
      ═══════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showColumnsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowColumnsModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowColumnsModal(false)}
        >
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Visible Columns</Text>
              <TouchableOpacity onPress={() => setShowColumnsModal(false)}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
              {columns.map((col) => {
                const isVisible = visibleColumns[col.key] !== false;
                return (
                  <TouchableOpacity
                    key={col.key}
                    style={styles.columnCheckItem}
                    onPress={() => toggleColumnVisibility(col.key)}
                  >
                    <View style={[styles.checkbox, isVisible && styles.checkboxActive]}>
                      {isVisible && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
                    </View>
                    <Text style={styles.columnCheckLabel}>{col.header}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  topTitleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  tableTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  tableSubtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    flexWrap: 'wrap',
    gap: 10,
  },
  searchContainer: {
    flex: 1,
    minWidth: 200,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    padding: 0,
    outlineStyle: 'none',
  } as any,
  clearBtn: { padding: 2 },
  toolbarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  actionBtnActive: {
    backgroundColor: '#1D4ED8',
    borderColor: '#1D4ED8',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  filterChipsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#EFF6FF',
    borderBottomWidth: 1,
    borderBottomColor: '#DBEAFE',
    gap: 8,
  },
  filterChipLabel: { fontSize: 11, fontWeight: '700', color: '#1D4ED8', flexShrink: 0 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
  },
  filterChipText: { fontSize: 11, color: '#1E293B' },
  clearAllChip: { paddingHorizontal: 8, paddingVertical: 4 },
  clearAllChipText: { fontSize: 11, fontWeight: '700', color: '#DC2626' },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  headerCell: {
    paddingRight: 12,
    justifyContent: 'center',
  },
  headerCellText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dataRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    alignItems: 'center',
  },
  evenRow: { backgroundColor: '#FFFFFF' },
  oddRow: { backgroundColor: '#FAFAFA' },
  dataCell: { paddingRight: 12, justifyContent: 'center' },
  cellText: { fontSize: 13, color: '#334155' },
  loadingContainer: { paddingVertical: 40, alignItems: 'center', justifyContent: 'center', gap: 8 },
  loadingText: { fontSize: 13, color: '#64748B' },
  emptyContainer: { paddingVertical: 40, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText: { fontSize: 13, color: '#64748B' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexWrap: 'wrap',
    gap: 8,
  },
  footerInfoText: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  paginationControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pageBtn: {
    width: 30,
    height: 30,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageBtnDisabled: { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' },
  pageNumberText: { fontSize: 12, fontWeight: '600', color: '#334155', paddingHorizontal: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  // Step 1 – Column list
  columnFilterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  columnFilterItemActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  columnFilterIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  columnFilterLabel: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  columnFilterActiveVal: { fontSize: 11, color: '#1D4ED8', marginTop: 2 },
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  clearAllBtnText: { fontSize: 13, fontWeight: '700', color: '#DC2626' },
  // Step 2 – Filter values
  filterValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  filterValueRowActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  filterValueRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterValueRadioActive: {
    borderColor: '#1D4ED8',
  },
  filterValueRadioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1D4ED8',
  },
  filterValueLabel: { fontSize: 14, color: '#334155', fontWeight: '500' },
  filterTextBox: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    outlineStyle: 'none',
  } as any,
  applyBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
  },
  applyBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  clearBtn2: {
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    alignItems: 'center',
  },
  clearBtn2Text: { fontSize: 13, fontWeight: '700', color: '#DC2626' },
  // Columns visibility modal
  columnCheckItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  columnCheckLabel: { fontSize: 14, color: '#334155', marginLeft: 10 },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: { backgroundColor: '#1D4ED8', borderColor: '#1D4ED8' },
});
