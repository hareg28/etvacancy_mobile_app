import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert, Modal, TextInput } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { Screen } from '@components/ui/Screen';
import { Card, CardHeader } from '@components/ui/Card';
import { Divider } from '@components/ui/Divider';
import Button from '@components/ui/Button';
import Input from '@components/ui/Input';
import { Ionicons } from '@expo/vector-icons';
import { categories as categoriesApi } from '@api/index';
import { COLORS } from '@constants/index';
import type { Category } from '@/types/index';

export default function AdminCategoriesScreen() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showReorderHint, setShowReorderHint] = useState(false);

  const { data, isLoading, refetch } = useQuery<Category[]>({
    queryKey: ['admin', 'categories'],
    queryFn: () => categoriesApi.list({ withCounts: true }),
  });

  const filtered = (data ?? []).filter((c: Category) =>
    !query || c.name.toLowerCase().includes(query.toLowerCase()),
  );

  const removeMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] }),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      categoriesApi.update(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] }),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [createName, setCreateName] = useState('');
  const [editName, setEditName] = useState('');
  const [selectedCat, setSelectedCat] = useState<Category | null>(null);

  const openCreate = () => {
    setCreateName('');
    setCreateModalVisible(true);
  };

  const handleCreateCategory = async () => {
    if (!createName || createName.trim().length === 0) return;
    await categoriesApi.create({
      name: createName.trim(),
      slug: createName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, ''),
      isActive: true,
      sortOrder: (data?.length ?? 0) + 1,
    });
    setCreateModalVisible(false);
    queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
  };

  const openEdit = (cat: Category) => {
    setSelectedCat(cat);
    setEditName(cat.name);
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedCat || !editName || editName.trim().length === 0) return;
    await categoriesApi.update(selectedCat.id, { name: editName.trim() });
    setEditModalVisible(false);
    queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
  };

  return (
    <Screen scrollable={false}>
      <View className="mb-4 mt-2">
        <View className="flex-row justify-between items-center">
          <View style={{ flex: 1 }}>
            <Text
              className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1"
              style={{ includeFontPadding: false }}
            >
              Categories
            </Text>
            <Text
              className="text-sm text-gray-500 dark:text-gray-400"
              style={{ includeFontPadding: false }}
            >
              {data?.length ?? 0} categories
            </Text>
          </View>
          <Button
            title="Add"
            variant="primary"
            size="sm"
            leftIcon="add-outline"
            onPress={openCreate}
          />
        </View>
      </View>

      <Card padding="md" className="mb-4">
        <View className="flex-row gap-2">
          <View style={{ flex: 1 }}>
            <Input
              value={query}
              onChangeText={setQuery}
              placeholder="Search categories"
              leftIcon="search-outline"
            />
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowReorderHint((v) => !v)}
            className="w-12 h-12 rounded-xl border border-gray-200 dark:border-neutral-700 items-center justify-center flex-shrink-0"
          >
            <Ionicons name="reorder-three-outline" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
        {showReorderHint && (
          <Text
            className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-5"
            style={{ includeFontPadding: false }}
          >
            Drag-and-drop reordering coming soon. Use the sort arrows to adjust order manually.
          </Text>
        )}
      </Card>

      <FlatList
        data={filtered}
        keyExtractor={(c) => c.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isLoading}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <Card padding="lg" variant="outlined">
            <View className="items-center py-10">
              <View className="w-20 h-20 rounded-full bg-gray-100 dark:bg-neutral-800 items-center justify-center mb-4">
                <Ionicons name="pricetags-outline" size={36} color="#94A3B8" />
              </View>
              <Text
                className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1 text-center"
                style={{ includeFontPadding: false }}
              >
                No categories
              </Text>
              <Text
                className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4"
                style={{ includeFontPadding: false }}
              >
                Tap &quot;Add&quot; to create your first category.
              </Text>
              <Button title="Add Category" variant="primary" size="sm" onPress={openCreate} />
            </View>
          </Card>
        }
        renderItem={({ item, index }) => (
          <Card padding="md" className="mb-3">
            <View className="flex-row items-center">
              <View
                className="w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-900/30 items-center justify-center mr-3 flex-shrink-0"
              >
                <Ionicons
                  name={(item.icon as any) ?? 'pricetag-outline'}
                  size={20}
                  color={COLORS.primary}
                />
              </View>
              <View className="flex-1">
                <View className="flex-row justify-between items-center flex-wrap">
                  <View className="flex-1 min-w-[55%]">
                    <View className="flex-row items-center">
                      <Text
                        className="text-base font-bold text-gray-900 dark:text-gray-100 mr-2"
                        style={{ includeFontPadding: false }}
                      >
                        {item.name}
                      </Text>
                      {!item.isActive && (
                        <View className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-neutral-700">
                          <Text
                            className="text-[10px] font-bold text-gray-600 dark:text-gray-400"
                            style={{ includeFontPadding: false }}
                          >
                            Hidden
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text
                      className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5"
                      style={{ includeFontPadding: false }}
                    >
                      Slug: {item.slug} • Order: {item.sortOrder}
                      {item.jobsCount != null ? ` • ${item.jobsCount} jobs` : ''}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1 mt-1">
                    <TouchableOpacity
                      activeOpacity={0.7}
                      disabled={index === 0}
                      className={`w-9 h-9 rounded-lg border items-center justify-center ${
                        index === 0 ? 'opacity-40' : ''
                      } border-gray-200 dark:border-neutral-700`}
                    >
                      <Ionicons name="chevron-up-outline" size={18} color="#64748B" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      disabled={index === (filtered.length ?? 0) - 1}
                      className={`w-9 h-9 rounded-lg border items-center justify-center ${
                        index === (filtered.length ?? 0) - 1 ? 'opacity-40' : ''
                      } border-gray-200 dark:border-neutral-700`}
                    >
                      <Ionicons name="chevron-down-outline" size={18} color="#64748B" />
                    </TouchableOpacity>
                  </View>
                </View>
                <Divider className="my-3" />
                <View className="flex-row flex-wrap gap-2">
                  <Button
                    title={item.isActive ? 'Hide' : 'Show'}
                    variant="outline"
                    size="sm"
                    leftIcon={item.isActive ? 'eye-off-outline' : 'eye-outline'}
                    onPress={() =>
                      toggleActive.mutate({ id: item.id, isActive: !item.isActive })
                    }
                  />
                  <Button
                    title="Edit"
                    variant="outline"
                    size="sm"
                    leftIcon="create-outline"
                    onPress={() => openEdit(item)}
                  />
                  <Button
                    title="Delete"
                    variant="outline"
                    size="sm"
                    leftIcon="trash-outline"
                    onPress={() =>
                      Alert.alert(
                        'Delete Category',
                        `Delete ${item.name}? Jobs will not be removed.`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: () => removeMutation.mutate(item.id),
                          },
                        ],
                      )
                    }
                  />
                </View>
              </View>
            </View>
          </Card>
        )}
      />

      {/* Create Category Modal */}
      <Modal
        visible={createModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          activeOpacity={1}
          onPress={() => setCreateModalVisible(false)}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 400,
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 24,
            }}
            onStartShouldSetResponder={() => true}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A' }}>New Category</Text>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 14 }}>
              <View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 }}>Category Name</Text>
                <Input
                  placeholder="e.g. Artificial Intelligence"
                  value={createName}
                  onChangeText={setCreateName}
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
                <View style={{ flex: 1 }}>
                  <Button
                    title="Cancel"
                    variant="outline"
                    size="md"
                    onPress={() => setCreateModalVisible(false)}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    title="Create"
                    variant="primary"
                    size="md"
                    onPress={handleCreateCategory}
                  />
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit Category Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          activeOpacity={1}
          onPress={() => setEditModalVisible(false)}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 400,
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 24,
            }}
            onStartShouldSetResponder={() => true}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A' }}>Rename Category</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 14 }}>
              <View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 }}>Category Name</Text>
                <Input
                  value={editName}
                  onChangeText={setEditName}
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
                <View style={{ flex: 1 }}>
                  <Button
                    title="Cancel"
                    variant="outline"
                    size="md"
                    onPress={() => setEditModalVisible(false)}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    title="Save Changes"
                    variant="primary"
                    size="md"
                    onPress={handleSaveEdit}
                  />
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </Screen>
  );
}
