import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar, Heart, ImageOff, MessageCircle, Search, Send,
  ShoppingCart, Sprout, X,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { communityApi } from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import FarmerLayout from '../../layouts/FarmerLayout';
import ProcessorLayout from '../../layouts/ProcessorLayout';
import { useAuth } from '../../hooks/useAuth';
import { useBilingual } from '../../hooks/useBilingual';
import { useToast } from '../../hooks/useToast';

/**
 * Community — the M2M marketplace & chat hub.
 *
 * Marketplace: live sell/buy listings from real batches and processor demands,
 * searchable and filterable, with like (❤) toggles and a "Chat" action that
 * opens a conversation drawer with that listing pre-loaded.
 *
 * Chat: slide-in drawer with polling-based message refresh and an optimistic
 * send so outgoing messages appear instantly.
 */

const isoDay = (iso) => (iso ? iso.slice(0, 10) : '');

const Community = () => {
  const bi = useBilingual();
  const { user } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [activeConversation, setActiveConversation] = useState(null);
  const [activeListing, setActiveListing] = useState(null);
  const [message, setMessage] = useState('');
  const [likedIds, setLikedIds] = useState({}); // optimistic like state: { "sell-3": true }
  const [burst, setBurst] = useState(null); // id string for the like pop animation

  const isSeller = user?.role === 'farmer' || user?.role === 'fpo';
  const imageUrl = (path) => (path
    ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/uploads/${path.split(/[\\/]/).pop()}`
    : '');

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['communityFeed', search],
    queryFn: () => communityApi.feed(search ? { search } : {}),
    refetchInterval: 15000,
  });
  const like = useMutation({
    mutationFn: (listing) => communityApi.toggleLike({ listing_type: listing.type, listing_id: listing.id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['communityFeed'] }),
  });
  const unlist = useMutation({
    mutationFn: (listing) => communityApi.unlist(listing.type, listing.id),
    onSuccess: () => {
      toastSuccess(bi('community.unlistedSuccess'));
      queryClient.invalidateQueries({ queryKey: ['communityFeed'] });
    },
    onError: (err) => toastError(err.payload?.message || err.message || bi('common.error')),
  });
  const { data: conversations = [] } = useQuery({
    queryKey: ['communityConversations'],
    queryFn: communityApi.conversations,
    refetchInterval: 15000,
  });
  const startConversation = useMutation({
    mutationFn: (listing) => communityApi.createConversation({ listing_type: listing.type, listing_id: listing.id }),
    onSuccess: ({ id }) => {
      setActiveConversation(id);
      queryClient.invalidateQueries({ queryKey: ['communityConversations'] });
    },
    onError: (err) => toastError(err.payload?.message || err.message || bi('common.error')),
  });
  const { data: messages = [] } = useQuery({
    queryKey: ['communityMessages', activeConversation],
    queryFn: () => communityApi.messages(activeConversation),
    enabled: Boolean(activeConversation),
    refetchInterval: 5000,
  });
  const sendMessage = useMutation({
    mutationFn: (body) => communityApi.sendMessage(activeConversation, body),
    // Optimistic append so the sent bubble appears instantly.
    onMutate: async (body) => {
      const key = ['communityMessages', activeConversation];
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData(key);
      queryClient.setQueryData(key, (old = []) => [
        ...old,
        { id: `temp-${Date.now()}`, body, mine: true, sender_label: 'You', pending: true },
      ]);
      return { previous, key };
    },
    onError: (_err, _body, context) => {
      if (context?.previous) queryClient.setQueryData(context.key, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['communityMessages', activeConversation] }),
  });

  const visible = useMemo(
    () => listings.filter((item) => tab === 'all' || item.type === tab),
    [listings, tab]
  );

  const toggleLike = (item) => {
    const key = `${item.type}-${item.id}`;
    setLikedIds((m) => ({ ...m, [key]: !m[key] }));
    setBurst(key);
    setTimeout(() => setBurst((b) => (b === key ? null : b)), 500);
    like.mutate(item);
  };

  const openChatFor = (listing) => {
    setActiveListing(listing);
    startConversation.mutate(listing);
  };

  const submitMessage = (e) => {
    e.preventDefault();
    const body = message.trim();
    if (!body || !activeConversation) return;
    sendMessage.mutate(body);
    setMessage('');
  };

  const tabs = [
    { key: 'all', label: bi('community.tabAll') },
    { key: 'sell', label: bi('community.tabSell') },
    { key: 'buy', label: bi('community.tabBuy') },
  ];

  const priceLabel = (item) => {
    if (item.type === 'sell') {
      return item.price_min != null
        ? `₹${item.price_min}–₹${item.price_max || item.price_min} / ${item.unit}`
        : bi('community.priceOnChat');
    }
    return item.price != null
      ? `₹${item.price} / ${item.unit}`
      : bi('community.priceOnChat');
  };

  const ListingCard = ({ item, index }) => {
    const isBuy = item.type === 'buy';
    const likeKey = `${item.type}-${item.id}`;
    const liked = likedIds[likeKey] ?? item.liked;
    const likes = Math.max(0, (item.likes || 0) + (likedIds[likeKey] ? (item.liked ? 0 : 1) : likedIds[likeKey] === false && item.liked ? -1 : 0));
    const own = item.owner_id === user?.id;
    const unlistOwnListing = () => {
      if (window.confirm(bi('community.unlistConfirm'))) {
        unlist.mutate(item);
      }
    };
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: Math.min(index * 0.05, 0.4), duration: 0.35 }}
      >
        <Card hover className="h-full">
          <Card.Body className="flex h-full flex-col">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {item.image_path ? (
                  <img src={imageUrl(item.image_path)} alt={item.crop} className="h-16 w-16 rounded-2xl object-cover" />
                ) : (
                  <span className={`flex h-16 w-16 items-center justify-center rounded-2xl ${isBuy ? 'bg-gold/15 text-gold' : 'bg-leaf/10 text-leaf'}`}>
                    {isBuy ? <ShoppingCart size={24} /> : <Sprout size={24} />}
                  </span>
                )}
                <div>
                  <h2 className="text-lg font-bold leading-tight">{item.crop}</h2>
                  <p className="mt-0.5 text-xs text-charcoal/50">
                    {isBuy ? bi('community.wantsToBuy') : bi('community.selling')} · {item.region}
                  </p>
                </div>
              </div>
              <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${isBuy ? 'bg-gold/15 text-gold' : 'bg-leaf/10 text-leaf'}`}>
                {isBuy ? bi('community.badgeBuy') : bi('community.badgeSell')}
              </span>
            </div>

            <p className="mt-3 line-clamp-2 flex-1 text-sm text-charcoal/70">{item.description}</p>

            <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
              <div className="rounded-xl bg-cream p-2.5">
                <span className="block text-[11px] text-charcoal/50">{bi('community.qty')}</span>
                <strong>{item.quantity} {item.unit}</strong>
              </div>
              <div className="rounded-xl bg-cream p-2.5">
                <span className="block text-[11px] text-charcoal/50">{bi('community.price')}</span>
                <strong className="whitespace-nowrap">{priceLabel(item)}</strong>
              </div>
              <div className="rounded-xl bg-cream p-2.5">
                <span className="block text-[11px] text-charcoal/50">{isBuy ? bi('community.deadline') : bi('community.quality')}</span>
                <strong className="flex items-center gap-1 whitespace-nowrap">
                  {isBuy
                    ? (item.deadline ? <><Calendar size={12} /> {isoDay(item.deadline)}</> : '—')
                    : (item.quality || '—')}
                </strong>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              {own ? (
                <Button
                  variant="outline"
                  className="flex flex-1 items-center justify-center gap-2 border-red-200 text-red-600 hover:bg-red-50"
                  onClick={unlistOwnListing}
                  disabled={unlist.isPending}
                >
                  {bi('community.unlist')}
                </Button>
              ) : (
                <>
                  <Button
                    variant="primary"
                    className="flex flex-1 items-center justify-center gap-2"
                    onClick={() => openChatFor(item)}
                    disabled={startConversation.isPending}
                  >
                    <MessageCircle size={16} /> {bi('community.chat')}
                  </Button>
                  <Button
                    variant="outline"
                    aria-label={bi('community.like')}
                    className={`flex items-center gap-1.5 px-4 ${liked ? 'border-red-200 text-red-600' : ''}`}
                    onClick={() => toggleLike(item)}
                  >
                    <motion.span
                      animate={burst === likeKey ? { scale: [1, 1.6, 1] } : { scale: 1 }}
                      transition={{ duration: 0.4 }}
                      className="inline-flex"
                    >
                      <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
                    </motion.span>
                    {likes}
                  </Button>
                </>
              )}
            </div>
          </Card.Body>
        </Card>
      </motion.div>
    );
  };

  const Layout = isSeller ? FarmerLayout : ProcessorLayout;
  return (
    <Layout>
      <div className="space-y-6 p-4 sm:p-6">
        {/* Header + search */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-leaf">{bi('community.eyebrow')}</p>
            <h1 className="mt-1 text-3xl font-bold">{bi('community.title')}</h1>
            <p className="mt-1 text-charcoal/60">{bi('community.subtitle')}</p>
          </div>
          <form
            className="relative"
            onSubmit={(e) => { e.preventDefault(); setSearch(searchInput.trim()); }}
          >
            <Search size={17} className="absolute left-3 top-3.5 text-charcoal/40" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={bi('community.searchPlaceholder')}
              className="w-full rounded-xl border border-cream-darker bg-white py-3 pl-10 pr-4 sm:w-80"
            />
          </form>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-cream-darker pb-3">
          {tabs.map((tb) => (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${tab === tb.key ? 'bg-forest text-white' : 'text-charcoal/60 hover:bg-cream'}`}
            >
              {tb.label}
            </button>
          ))}
        </div>

        {/* Marketplace grid */}
        {isLoading ? (
          <LoadingSkeleton count={4} />
        ) : visible.length === 0 ? (
          <Card>
            <Card.Body className="flex flex-col items-center gap-3 py-12 text-center">
              <span className="rounded-2xl bg-cream p-4 text-charcoal/40"><ImageOff size={28} /></span>
              <p className="font-semibold">{bi('community.emptyTitle')}</p>
              <p className="max-w-sm text-sm text-charcoal/55">{bi('community.emptyHint')}</p>
            </Card.Body>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((item, index) => (
              <ListingCard key={`${item.type}-${item.id}`} item={item} index={index} />
            ))}
          </div>
        )}

        {/* Conversations */}
        <Card>
          <Card.Header>
            <h2 className="flex items-center gap-2 font-semibold">
              <MessageCircle size={18} className="text-leaf" /> {bi('community.conversationsTitle')}
            </h2>
          </Card.Header>
          <Card.Body>
            {conversations.length === 0 ? (
              <p className="text-sm text-charcoal/55">{bi('community.noConversations')}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => setActiveConversation(conversation.id)}
                    className={`max-w-xs rounded-xl border px-3 py-2 text-left text-sm transition-colors ${activeConversation === conversation.id ? 'border-leaf bg-leaf/10' : 'border-cream-darker hover:border-leaf/50'}`}
                  >
                    <strong className="block truncate">
                      {conversation.listing_type === 'buy' ? bi('community.badgeBuy') : bi('community.badgeSell')} #{conversation.listing_id}
                    </strong>
                    <span className="block truncate text-charcoal/55">{conversation.last_message}</span>
                  </button>
                ))}
              </div>
            )}
          </Card.Body>
        </Card>
      </div>

      {/* Chat drawer */}
      {activeConversation && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-label={bi('community.chat')}>
          <button
            aria-label={bi('common.close')}
            className="absolute inset-0 bg-charcoal/40 backdrop-blur-[2px]"
            onClick={() => setActiveConversation(null)}
          />
          <aside className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-cream-darker px-5 py-4">
              <div>
                <p className="font-bold">{bi('community.chatTitle')}</p>
                <p className="text-xs text-charcoal/55">
                  {activeListing ? `${activeListing.crop} · ${activeListing.type === 'buy' ? bi('community.badgeBuy') : bi('community.badgeSell')}` : bi('community.chatSubtitle')}
                </p>
              </div>
              <button
                onClick={() => setActiveConversation(null)}
                className="rounded-lg p-2 hover:bg-cream"
                aria-label={bi('common.close')}
              >
                <X size={18} />
              </button>
            </header>
            <div className="flex-1 space-y-2 overflow-y-auto bg-cream/50 p-4">
              {messages.length === 0 ? (
                <p className="mt-8 text-center text-sm text-charcoal/50">{bi('community.chatEmpty')}</p>
              ) : (
                messages.map((item) => (
                  <div key={item.id} className={`flex ${item.mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${item.mine ? 'rounded-br-sm bg-forest text-white' : 'rounded-bl-sm bg-white'}`}>
                      {item.body}
                      {item.pending && <span className="ml-2 text-[10px] opacity-70">…</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={submitMessage} className="flex gap-2 border-t border-cream-darker p-4">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={bi('community.messagePlaceholder')}
                className="min-w-0 flex-1 rounded-xl border border-cream-darker px-3 py-2.5 text-sm"
              />
              <Button type="submit" variant="primary" disabled={!message.trim() || sendMessage.isPending} aria-label={bi('community.send')}>
                <Send size={16} />
              </Button>
            </form>
          </aside>
        </div>
      )}
    </Layout>
  );
};

export default Community;
